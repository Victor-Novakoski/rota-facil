import { describe, expect, it } from 'vitest';
import { buildRoute, convertRows, editPackages, findCarrier, findRouteApp } from '.';
import { EXAMPLE_ROWS } from '../ui/example';
import { sameStreet } from './duplicates';

const imile = findCarrier('imile');
const spoke = findRouteApp('spoke');
const h = EXAMPLE_ROWS[0];

/** Linha inventada: rastreio, endereço e CEP. */
function row(w: string, address: string, zip = '80000-020') {
  const r: string[] = h.map(() => '');
  const set = (k: keyof typeof imile.columns, v: string) => (r[h.indexOf(imile.columns[k])] = v);
  set('waybill', w); set('zip', zip); set('state', 'Paraná'); set('city', 'Curitiba'); set('area', 'Centro');
  set('address', address); set('lat', '-25.43'); set('lon', '-49.27');
  return r;
}
const run = (...rows: string[][]) => convertRows([h, ...rows], imile, spoke);
const pairs = (...rows: string[][]) => run(...rows).duplicates.map((d) => d.stops.map((s) => s.line1));

describe('endereço repetido escrito de outro jeito', () => {
  it('acha "Rua XV 72" e "R. XV de Novembro 72" no mesmo CEP e sugere o nome mais completo', () => {
    const r = run(row('3320000000201', 'Rua XV 72'), row('3320000000202', 'R. XV de Novembro 72 apto 3'));
    expect(r.stops).toHaveLength(2);
    expect(r.duplicates).toHaveLength(1);
    const [d] = r.duplicates;
    expect(d.stops.map((s) => s.line1)).toEqual(['Rua XV, 72', 'Rua XV de Novembro, 72']);
    expect(d.suggested).toBe(1);
  });

  it('acha título a mais ou a menos e letra trocada', () => {
    expect(pairs(row('3320000000211', 'Rua Deodoro 15'), row('3320000000212', 'Rua Marechal Deodoro 15'))).toHaveLength(1);
    expect(pairs(row('3320000000221', 'Rua das Flroes 88'), row('3320000000222', 'Rua das Flores 88'))).toHaveLength(1);
    expect(pairs(row('3320000000231', 'Av Inventada 300'), row('3320000000232', 'Rua Inventada 300'))).toHaveLength(1);
  });

  it('não acha nada com CEP diferente, número diferente, rua diferente ou sem número', () => {
    expect(pairs(row('3320000000241', 'Rua XV 72', '80000-021'), row('3320000000242', 'Rua XV de Novembro 72'))).toEqual([]);
    expect(pairs(row('3320000000251', 'Rua XV 72'), row('3320000000252', 'Rua XV de Novembro 74'))).toEqual([]);
    expect(pairs(row('3320000000261', 'Rua das Flores 10'), row('3320000000262', 'Rua dos Pinheiros 10'))).toEqual([]);
    expect(pairs(row('3320000000271', 'Rua XV'), row('3320000000272', 'Rua XV de Novembro'))).toEqual([]);
    // nome curto com uma letra diferente é outra rua, não erro de digitação
    expect(pairs(row('3320000000281', 'Rua Ana 5'), row('3320000000282', 'Rua Ina 5'))).toEqual([]);
  });

  it('a planilha de exemplo não tem nada para juntar', () => {
    expect(run(...EXAMPLE_ROWS.slice(1)).duplicates).toEqual([]);
  });

  it('juntar: os pacotes viram uma parada só, cada um com o seu complemento, e a conferência passa', () => {
    const r = run(row('3320000000201', 'Rua XV 72 casa 2'), row('3320000000202', 'R. XV de Novembro 72 apto 3'), row('3320000000203', 'Rua Outra 9'));
    const [d] = r.duplicates;
    const keep = d.stops[d.suggested];
    const other = d.stops[1 - d.suggested];
    const merged = buildRoute(editPackages(r.packages, other.packages.map((p) => p.waybill), { line1: keep.line1 }), r.noAddress, spoke);
    expect(merged.stops).toHaveLength(2);
    expect(merged.stops[0]).toMatchObject({ line1: 'Rua XV de Novembro, 72', line2: 'casa 2 / apto 3', edited: true });
    expect(merged.stops[0].notes).toBe('0201, 0202 | 2 PACOTES: 3320000000201 (casa 2) ; 3320000000202 (apto 3)');
    expect(merged.duplicates).toEqual([]);
    expect(merged.check).toMatchObject({ ok: true, total: 3, stops: 2 });
  });

  it('sameStreet: um nome dentro do outro ou até 2 letras trocadas num nome comprido', () => {
    expect(sameStreet(['xv'], ['xv', 'novembro'])).toBe(true);
    expect(sameStreet(['flores'], ['flroes'])).toBe(true);
    expect(sameStreet(['flores'], ['pinheiros'])).toBe(false);
  });
});
