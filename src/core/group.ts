import type { Package, Stop, Warning } from './types';
import { lastDigits, plain } from './text';

const inBrazil = (lat: number, lon: number) => lat >= -34.5 && lat <= 6 && lon >= -74.5 && lon <= -28;

/** Texto do complemento dentro das notas, sem parênteses dentro de parênteses. */
const noteComp = (c: string) => c.replace(/\s*\(sem número\)$/, ', sem número').replace(/^, /, '');

/** Seção 4 da referência: mesmo Address Line 1 + CEP = uma parada (sem número, também o mesmo ponto no mapa). */
export function groupStops(packages: Package[]): Stop[] {
  const groups = new Map<string, Package[]>();
  for (const p of packages) {
    // sem número, "Rua X" + CEP pode ser casas diferentes: só junta se o ponto no mapa também for o mesmo
    const spot = p.flags.noNumber && p.lat !== null && p.lon !== null ? `|${p.lat.toFixed(4)},${p.lon.toFixed(4)}` : '';
    const key = `${plain(p.line1)}|${p.zip.replace(/\D/g, '')}${spot}`;
    const list = groups.get(key);
    if (list) list.push(p);
    else groups.set(key, [p]);
  }

  return [...groups.values()].map((items, i) => {
    const first = items[0];
    const comps: string[] = [];
    for (const it of items) {
      if (it.line2 && !comps.some((c) => plain(c) === plain(it.line2))) comps.push(it.line2);
    }
    const withCoord = items.find((it) => it.lat !== null && it.lon !== null);
    const parts = items.map((it) => it.waybill + (it.line2 ? ` (${noteComp(it.line2)})` : ''));
    // os 4 últimos dígitos vêm primeiro: é o número grande da etiqueta, o que o entregador procura no pacote
    const finals = items.map((it) => lastDigits(it.waybill)).join(', ');
    const notes = `${finals} | ` + (items.length > 1 ? `${items.length} PACOTES: ` : '1 pacote: ') + parts.join(' ; ');

    // seção 5: avisos
    const warnings: Warning[] = [];
    // a localização da planilha não vai para o app de rota, mas um ponto estranho indica endereço estranho
    if (withCoord && withCoord.lat !== null && withCoord.lon !== null && !inBrazil(withCoord.lat, withCoord.lon)) {
      warnings.push({ kind: 'oddCoords', text: 'A localização da planilha está fora do Brasil. Confira no app de rota se a parada caiu no lugar certo.' });
    }
    if (items.some((it) => it.flags.noNumber)) warnings.push({ kind: 'noNumber', text: 'Sem número no endereço.' });
    const fixes = [...new Set(items.flatMap((it) => it.flags.fixes))];
    for (const fx of fixes) warnings.push({ kind: 'nameFixed', text: `Nome da rua corrigido: ${fx}.` });
    if (items.some((it) => it.flags.reordered)) {
      warnings.push({ kind: 'reordered', text: 'Endereço corrigido: o complemento estava antes do número. Confira o número da casa.' });
    }
    if (items.some((it) => it.flags.zipRange)) {
      warnings.push({
        kind: 'zipRange',
        text: 'O endereço tinha a faixa de números do CEP (ex.: "de 1001 a 2999"), que foi tirada. Confira o número da casa na etiqueta.',
      });
    }
    if (items.some((it) => it.flags.twoNumbers)) {
      warnings.push({
        kind: 'twoNumbers',
        text: 'O endereço tem dois números seguidos e o primeiro foi usado como número da casa. Confira na etiqueta qual é o certo.',
      });
    }
    if (!/^\d{5}-\d{3}$/.test(first.zip)) warnings.push({ kind: 'oddZip', text: 'CEP estranho na planilha.' });

    return {
      no: i + 1,
      line1: first.line1,
      line2: comps.join(' / '),
      city: first.city,
      state: first.state,
      zip: first.zip,
      area: first.area,
      lat: withCoord?.lat ?? null,
      lon: withCoord?.lon ?? null,
      packages: items,
      notes,
      warnings,
      edited: items.some((it) => it.edited === true),
    };
  });
}
