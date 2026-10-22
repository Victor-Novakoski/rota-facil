import type { CleanAddress } from './types';
import { escapeRegExp, plain } from './text';

/**
 * Correções de nomes de rua conhecidos (regra 3.2 da referência técnica).
 * Para ampliar, é só adicionar uma linha.
 */
export const STREET_FIXES: Array<[RegExp, string]> = [
  [/^Marechal Deodoro/iu, 'Rua Marechal Deodoro'],
  [/^bar[ãa]o de rio branco/iu, 'Rua Barão do Rio Branco'],
  [/^Rua Candido de le[ãa]o/iu, 'Rua Cândido de Leão'],
  [/^Rua Candido Lopes/iu, 'Rua Cândido Lopes'],
  [/^Praça general Osório/iu, 'Praça General Osório'],
  [/^Rua Pedro ivo/iu, 'Rua Pedro Ivo'],
];

/**
 * Abreviações comuns no começo do endereço. Só valem no início do nome da rua:
 * primeiro o tipo (R., Av., Pça...), depois títulos (Cel., Dr., Mal....).
 * Fora daí (ex.: "Dr. Fulano" no complemento) o texto fica como o cliente escreveu.
 */
export const STREET_TYPES: Record<string, string> = {
  r: 'Rua', av: 'Avenida', ave: 'Avenida', pca: 'Praça', pc: 'Praça', al: 'Alameda', tv: 'Travessa', trav: 'Travessa',
  rod: 'Rodovia', estr: 'Estrada', est: 'Estrada', lgo: 'Largo', lg: 'Largo',
};
export const NAME_TITLES: Record<string, string> = {
  cel: 'Coronel', mal: 'Marechal', dr: 'Doutor', dra: 'Doutora', gen: 'General', pres: 'Presidente', prof: 'Professor',
  profa: 'Professora', cap: 'Capitão', ten: 'Tenente', sgt: 'Sargento', maj: 'Major', alm: 'Almirante', brig: 'Brigadeiro',
  dep: 'Deputado', gov: 'Governador', ver: 'Vereador', des: 'Desembargador', eng: 'Engenheiro', pe: 'Padre',
  sto: 'Santo', sta: 'Santa', sra: 'Senhora', cons: 'Conselheiro', visc: 'Visconde', com: 'Comendador',
};

/** "R. Cel. Fulano 100" -> "Rua Coronel Fulano 100". Para no primeiro token que não é abreviação. */
function expandAbbreviations(a: string): string {
  const tk = a.split(' ');
  let k = 0;
  const key = (t: string) => plain(t).replace(/\.$/, '');
  if (tk.length > 1 && STREET_TYPES[key(tk[0])]) tk[k++] = STREET_TYPES[key(tk[0])];
  else if (tk.length > 1 && /^(rua|avenida|praca|alameda|travessa|rodovia|estrada|largo)$/.test(key(tk[0]))) k++;
  // título só se depois dele vier mais alguma palavra (o nome), nunca um número
  while (k < tk.length - 1 && NAME_TITLES[key(tk[k])] && !/^\d/.test(tk[k + 1])) {
    tk[k] = NAME_TITLES[key(tk[k])];
    k++;
  }
  return tk.join(' ');
}

/** Palavras de complemento usadas na regra "complemento antes do número". */
export const COMPLEMENT_WORDS = ['apto', 'apt', 'ap', 'apê', 'ape', 'apartamento', 'loja', 'lj', 'sala', 'sl', 'bloco', 'bl', 'casa'];

/** Palavras onde cortar o texto quando o endereço não tem número. */
const NO_NUMBER_SPLIT = COMPLEMENT_WORDS.concat([
  'consultório', 'edifício', 'ed', 'condomínio', 'cond', 'prédio', 'fundos', 'esquina', 'próximo',
  'perto', 'frente', 'referência', 'ref', 'clínica', 'escritório', 'empresa', 'mercado', 'farmácia',
  'andar', 'térreo', 'portaria',
]).map(plain);

const COMPLEMENT_KEYS = COMPLEMENT_WORDS.map(plain);
const wordKey = (t: string) => plain(t).replace(/[.:]+$/, '');
const isNum = (t: string) => /^\d+$/.test(t);
const isSN = (t: string) => /^s\/n[º°]?\.?$/i.test(t) || /^s\.n\.?$/i.test(t);
const isCompWord = (t: string) => COMPLEMENT_KEYS.includes(wordKey(t));

/** Regra 3.5: tira "Centro" (ou o bairro da linha) que sobrou no fim do complemento. */
function stripTrailingArea(s: string, area: string): string {
  let t = s;
  for (const name of ['Centro', area].filter(Boolean)) {
    t = t.replace(new RegExp(`(^|[\\s\\-])${escapeRegExp(name.trim())}$`, 'iu'), '').trim();
  }
  return t.replace(/^[\s\-–]+|[\s\-–]+$/g, '');
}

/** Recebe o endereço como o cliente digitou e separa rua + número (line1) e complemento (line2). */
export function cleanAddress(raw: string, area = ''): CleanAddress {
  const flags = { fixes: [] as string[], noNumber: false, reordered: false, dupRemoved: false };

  // regra 3.1: vírgulas viram espaço
  let a = String(raw ?? '').replace(/\s*,\s*/g, ' ').replace(/\s+/g, ' ').trim();
  a = a.replace(/(^|\s)n[º°]\.?\s*(?=\d)/giu, '$1'); // "nº 12" -> "12"

  a = expandAbbreviations(a);

  // regra 3.2: nomes conhecidos
  for (const [re, rep] of STREET_FIXES) {
    const m = a.match(re);
    const b = a.replace(re, rep);
    if (m && b !== a) {
      flags.fixes.push(`${m[0]} → ${rep}`);
      a = b;
    }
  }

  const tk = a.split(' ').filter(Boolean);

  // regra 3.3: primeiro número (pulando nomes como "7 de Setembro" e "24 de Maio")
  let i = -1;
  for (let k = 1; k < tk.length; k++) {
    if (isSN(tk[k])) { i = k; break; }
    if (isNum(tk[k]) && !/^(de|do|da)$/i.test(tk[k + 1] ?? '')) { i = k; break; }
  }

  let street: string[];
  let number: string | null = null;
  let comp: string[];

  if (i === -1) {
    // regra 3.7: sem número nenhum
    flags.noNumber = true;
    let j = -1;
    for (let k = 2; k < tk.length; k++) {
      if (NO_NUMBER_SPLIT.includes(wordKey(tk[k]))) { j = k; break; }
    }
    street = j === -1 ? tk : tk.slice(0, j);
    comp = j === -1 ? [] : tk.slice(j);
  } else if (isSN(tk[i])) {
    flags.noNumber = true;
    street = tk.slice(0, i);
    comp = ['s/n', ...tk.slice(i + 1)];
  } else if (i >= 2 && isCompWord(tk[i - 1]) && isNum(tk[i + 1] ?? '')) {
    // regra 3.6: "apto 91 430" -> número 430, complemento "apto 91"
    flags.reordered = true;
    street = tk.slice(0, i - 1);
    number = tk[i + 1];
    comp = [tk[i - 1], tk[i], ...tk.slice(i + 2)];
  } else if (i >= 2 && isCompWord(tk[i - 1])) {
    // "Rua X apto 91" sem o número da casa
    flags.noNumber = true;
    street = tk.slice(0, i - 1);
    comp = tk.slice(i - 1);
  } else {
    street = tk.slice(0, i);
    number = tk[i];
    comp = tk.slice(i + 1);
  }

  // regra 3.4: número repetido ("64 64")
  if (number && comp[0] === number) {
    comp = comp.slice(1);
    flags.dupRemoved = true;
  }

  const st = street.join(' ').replace(/[\s\-–]+$/, '');
  let line2 = stripTrailingArea(comp.join(' '), area);
  if (flags.noNumber && !/^s\/n/i.test(line2)) line2 = `${line2 ? `${line2} ` : ''}(sem número)`;

  return { line1: number ? `${st}, ${number}` : st, line2, flags };
}
