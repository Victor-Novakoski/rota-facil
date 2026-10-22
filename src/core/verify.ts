import { readSheets } from './spreadsheet';
import type { Package, RouteAppProfile, VerifyResult } from './types';
import { cellText, digitsOf } from './text';

/**
 * Seção 6 da referência: relê o arquivo que vai para o entregador e compara com a planilha de entrada.
 * Se qualquer coisa não bater, o arquivo não é liberado.
 */
export function verify(sheet: ArrayBuffer, packages: Package[], app: RouteAppProfile): VerifyResult {
  const errors: string[] = [];
  const out = readSheets(sheet)[0] ?? [];
  const header = (out[0] ?? []).map(cellText);
  if (header.join('|') !== app.headers.join('|')) errors.push('Os cabeçalhos do arquivo gerado não estão certos.');

  const col = Object.fromEntries(Object.entries(app.cols).map(([k, h]) => [k, header.indexOf(h)])) as Record<keyof RouteAppProfile['cols'], number>;
  const rows = out.slice(1).filter((r) => r.some((v) => v !== null && v !== ''));

  const total = rows.reduce<number>((s, r) => s + (Number(r[col.packages]) || 0), 0);
  if (total !== packages.length) errors.push(`O arquivo tem ${total} pacotes, mas a planilha tem ${packages.length}.`);

  // em que linha aparece cada rastreio
  const seen = new Map<string, number[]>();
  rows.forEach((r, ri) => {
    const ids = digitsOf(r[col.notes]).filter((d) => d.length >= 8);
    if (ids.length !== Number(r[col.packages])) errors.push(`Na parada ${ri + 1} a quantidade de pacotes não bate com os rastreios.`);
    for (const d of ids) seen.set(d, [...(seen.get(d) ?? []), ri]);
  });

  const expected = new Map<string, number>();
  for (const p of packages) expected.set(p.waybill, (expected.get(p.waybill) ?? 0) + 1);
  for (const [w, n] of expected) {
    const got = seen.get(w)?.length ?? 0;
    if (got !== n) errors.push(`O rastreio final ${w.slice(-4)} aparece ${got} vez(es) no arquivo, mas devia aparecer ${n}.`);
  }
  for (const w of seen.keys()) {
    if (!expected.has(w)) errors.push(`O arquivo tem um rastreio que não está na planilha (final ${w.slice(-4)}).`);
  }

  const rowOf = (w: string) => seen.get(w)?.[0];
  for (const p of packages) {
    const ri = rowOf(p.waybill);
    if (ri === undefined) continue;
    const r = rows[ri];
    const end = p.waybill.slice(-4);
    if (cellText(r[col.zip]) !== p.zip) errors.push(`CEP diferente no pacote final ${end}.`);
    if (cellText(r[col.city]) !== p.city) errors.push(`Cidade diferente no pacote final ${end}.`);
    if (cellText(r[col.state]) !== p.state) errors.push(`Estado diferente no pacote final ${end}.`);

    const outDigits = new Set(digitsOf(`${cellText(r[col.line1])} ${cellText(r[col.line2])}`));
    // endereço editado: confere com o que o entregador digitou, não com a planilha
    const source = p.edited ? `${p.line1} ${p.line2}` : p.rawAddress;
    const lost = digitsOf(source).filter((d) => !outDigits.has(d));
    if (lost.length) errors.push(`No pacote final ${end} sumiu o número ${lost.join(', ')} do endereço.`);

    if (p.lat !== null && p.lon !== null) {
      const lat = r[col.lat];
      const lon = r[col.lon];
      const sameStop = packages.filter((q) => rowOf(q.waybill) === ri);
      const ok = typeof lat === 'number' && typeof lon === 'number' && sameStop.some((q) => q.lat === lat && q.lon === lon);
      if (!ok) errors.push(`A localização do pacote final ${end} não confere com a planilha.`);
    }
  }

  return { ok: errors.length === 0, errors: [...new Set(errors)], total, stops: rows.length };
}
