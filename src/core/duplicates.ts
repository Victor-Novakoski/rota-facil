import type { DuplicatePair, Stop } from './types';
import { plain } from './text';

/** Palavras que não ajudam a diferenciar uma rua da outra. */
const IGNORE = new Set([
  'de', 'da', 'do', 'das', 'dos', 'e',
  'rua', 'avenida', 'praca', 'alameda', 'travessa', 'rodovia', 'estrada', 'largo', 'r', 'av',
]);

/** "Rua XV de Novembro, 72" -> nome ["xv", "novembro"] e número "72". Sem número, fica de fora. */
function parse(line1: string): { name: string[]; number: string } | null {
  const m = line1.match(/^(.*),\s*(\d+)$/);
  if (!m) return null;
  const name = plain(m[1]).replace(/[.,'’-]/g, ' ').split(' ').filter((t) => t && !IGNORE.has(t));
  return name.length ? { name, number: m[2] } : null;
}

/** Quantas letras precisa trocar para um texto virar o outro. */
function editDistance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}

/**
 * Mesmo nome escrito de outro jeito: um nome cabe inteiro no outro ("XV" e "XV de Novembro",
 * "Deodoro" e "Marechal Deodoro") ou só uma ou duas letras trocadas num nome comprido ("Flroes").
 */
export function sameStreet(a: string[], b: string[]): boolean {
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  if (short.every((t) => long.includes(t))) return true;
  const x = a.join(' ');
  const y = b.join(' ');
  return Math.min(x.length, y.length) >= 6 && editDistance(x, y) <= 2;
}

/**
 * Paradas que podem ser a mesma casa: mesmo CEP, mesmo número e nome da rua parecido.
 * Só sugere; quem decide se junta é o entregador.
 */
export function findDuplicates(stops: Stop[]): DuplicatePair[] {
  const buckets = new Map<string, Array<{ stop: Stop; name: string[] }>>();
  for (const stop of stops) {
    const p = parse(stop.line1);
    const zip = stop.zip.replace(/\D/g, '');
    if (!p || !zip) continue;
    const key = `${zip}|${p.number}`;
    buckets.set(key, [...(buckets.get(key) ?? []), { stop, name: p.name }]);
  }
  const pairs: DuplicatePair[] = [];
  for (const list of buckets.values()) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const [a, b] = [list[i], list[j]];
        if (!sameStreet(a.name, b.name)) continue;
        // sugere o nome mais completo; empate fica com o que tem mais pacotes
        const score = (x: typeof a) => x.name.join(' ').length * 1000 + x.stop.packages.length;
        pairs.push({ stops: [a.stop, b.stop], suggested: score(b) > score(a) ? 1 : 0 });
      }
    }
  }
  return pairs;
}
