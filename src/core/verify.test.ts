import { describe, expect, it } from 'vitest';
import { buildRouteSheet, convertRows, findCarrier, findRouteApp } from '.';
import { verify } from './verify';

const imile = findCarrier('imile');
const spoke = findRouteApp('spoke');
const h = Object.values(imile.columns);
// endereços e telefones inventados
const row = (w: string, addr: string) => {
  const r: string[] = h.map(() => '');
  const set = (k: keyof typeof imile.columns, v: string) => (r[h.indexOf(imile.columns[k])] = v);
  set('waybill', w); set('zip', '80000-050'); set('state', 'Paraná'); set('city', 'Curitiba'); set('area', 'Centro');
  set('address', addr); set('lat', '0'); set('lon', '0');
  return r;
};
const convert = (...rows: string[][]) => convertRows([h, ...rows], imile, spoke);

describe('conferência', () => {
  // Revisão: telefone no complemento vai para as notas e era tomado por rastreio, travando o arquivo do dia
  it('telefone ou CEP no complemento não trava a conferência', () => {
    const r = convert(
      row('3320000001001', 'Rua Inventada 10 apto 3 tel 41999998888'),
      row('3320000001002', 'Rua Inventada 10 casa 2 cep 80000050'),
      row('3320000001003', 'Rua Modelo 20 fone 41 99999-8888'),
    );
    expect(r.stops[0].notes).toContain('41999998888');
    expect(r.check).toMatchObject({ ok: true, errors: [], total: 3, stops: 2 });
  });

  it('aceita rastreio com letras', () => {
    expect(convert(row('IM0000001004', 'Rua Inventada 30'), row('3320000001005', 'Rua Inventada 31')).check.ok).toBe(true);
  });

  it('continua pegando pacote que sumiu do arquivo', () => {
    const r = convert(row('3320000001006', 'Rua Inventada 40'), row('3320000001007', 'Rua Inventada 41'));
    const check = verify(buildRouteSheet(r.stops.slice(0, 1), spoke), r.packages, spoke);
    expect(check.ok).toBe(false);
    expect(check.errors).toContain('O arquivo tem 1 pacotes, mas a planilha tem 2.');
    expect(check.errors).toContain('O rastreio final 1007 aparece 0 vez(es) no arquivo, mas devia aparecer 1.');
  });

  it('continua pegando rastreio que não é da planilha', () => {
    const r = convert(row('3320000001008', 'Rua Inventada 50 apto 41999998888'));
    const other = convert(row('3320000001009', 'Rua Inventada 50'));
    const check = verify(buildRouteSheet(other.stops, spoke), r.packages, spoke);
    expect(check.ok).toBe(false);
    expect(check.errors).toContain('O arquivo tem um rastreio que não está na planilha (final 1009).');
  });

  it('continua pegando CEP trocado e número perdido', () => {
    const r = convert(row('3320000001010', 'Rua Inventada 60 apto 2'));
    const broken = r.stops.map((s) => ({ ...s, zip: '80000-999', line1: 'Rua Inventada' }));
    const check = verify(buildRouteSheet(broken, spoke), r.packages, spoke);
    expect(check.errors).toContain('CEP diferente no pacote final 1010.');
    expect(check.errors).toContain('No pacote final 1010 sumiu o número 60 do endereço.');
  });
});
