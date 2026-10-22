import { describe, expect, it } from 'vitest';
import { convertRows, findCarrier, findRouteApp } from '.';
import { EXAMPLE_ROWS } from '../ui/example';
import { distanceKm } from './far';

const imile = findCarrier('imile');
const spoke = findRouteApp('spoke');
const h = EXAMPLE_ROWS[0];

/** Linha inventada com o ponto no mapa (iMile: longitude antes da latitude). */
function row(n: number, lat: number, lon: number, zip = `80000-1${String(n).padStart(2, '0')}`) {
  const r: string[] = h.map(() => '');
  const set = (k: keyof typeof imile.columns, v: string) => (r[h.indexOf(imile.columns[k])] = v);
  set('waybill', `33200000009${String(n).padStart(2, '0')}`); set('zip', zip); set('state', 'Paraná'); set('city', 'Curitiba');
  set('area', 'Centro'); set('address', `Rua Inventada ${'ABCDEFGHIJ'[n]} ${100 + n}`); set('lat', String(lat)); set('lon', String(lon));
  return r;
}
const farOf = (rows: string[][]) =>
  convertRows([h, ...rows], imile, spoke).stops.filter((s) => s.warnings.some((w) => w.kind === 'farCoords')).map((s) => s.line1);

// pontos espalhados pelo centro de uma cidade inventada, uns 1 a 3 km entre si
const city = [[-25.43, -49.27], [-25.44, -49.28], [-25.42, -49.26], [-25.435, -49.29], [-25.45, -49.27]];

describe('parada longe das outras', () => {
  it('a distância bate com o mapa (1 grau de latitude ≈ 111 km)', () => {
    expect(distanceKm(-25, -49, -26, -49)).toBeCloseTo(111.2, 0);
  });

  it('avisa a parada que caiu em outra cidade e diz mais ou menos a distância', () => {
    const r = convertRows([h, ...city.map(([la, lo], i) => row(i + 1, la, lo)), row(9, -23.55, -46.63)], imile, spoke);
    const far = r.stops.filter((s) => s.warnings.some((w) => w.kind === 'farCoords'));
    expect(far.map((s) => s.line1)).toEqual(['Rua Inventada J, 109']);
    expect(far[0].warnings.at(-1)?.text).toBe('Ponto no mapa longe das outras paradas (uns 340 km). Pode estar em outra cidade. Confira antes de importar.');
    expect(r.check.ok).toBe(true);
  });

  it('não avisa nada numa rota normal de cidade', () => {
    expect(farOf(city.map(([la, lo], i) => row(i + 1, la, lo)))).toEqual([]);
  });

  it('não avisa uma parada no bairro vizinho, a menos de 15 km', () => {
    expect(farOf([...city.map(([la, lo], i) => row(i + 1, la, lo)), row(9, -25.53, -49.27)])).toEqual([]);
  });

  it('rota espalhada (zona rural): só avisa o que está bem mais longe que o normal', () => {
    // paradas a uns 20 a 30 km umas das outras: 40 km a mais não é estranho, 300 km é
    const rural = [[-25.2, -49.0], [-25.4, -49.2], [-25.0, -49.3], [-25.3, -48.8], [-25.1, -49.1]];
    const rows = rural.map(([la, lo], i) => row(i + 1, la, lo));
    expect(farOf([...rows, row(8, -25.55, -49.4)])).toEqual([]);
    expect(farOf([...rows, row(9, -22.9, -47.06)])).toEqual(['Rua Inventada J, 109']);
  });

  it('com menos de 3 paradas no mapa não dá para comparar, então não avisa', () => {
    expect(farOf([row(1, -25.43, -49.27), row(9, -23.55, -46.63)])).toEqual([]);
  });

  it('ponto fora do Brasil fica só com o aviso dele, sem repetir', () => {
    const r = convertRows([h, ...city.map(([la, lo], i) => row(i + 1, la, lo)), row(9, 40.7, -74.0)], imile, spoke);
    const kinds = r.stops.find((s) => s.line1 === 'Rua Inventada J, 109')?.warnings.map((w) => w.kind);
    expect(kinds).toEqual(['oddCoords']);
  });

  it('a planilha de exemplo não ganha aviso novo', () => {
    expect(farOf(EXAMPLE_ROWS.slice(1))).toEqual([]);
  });
});
