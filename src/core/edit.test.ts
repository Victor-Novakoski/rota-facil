import { describe, expect, it } from 'vitest';
import { buildRoute, buildRouteSheet, convertRows, editPackages, findCarrier, findRouteApp } from '.';
import { EXAMPLE_ROWS } from '../ui/example';
import { readSheets } from './spreadsheet';
import { verify } from './verify';
import { withNumberComma } from './edit';

const imile = findCarrier('imile');
const spoke = findRouteApp('spoke');
const base = convertRows(EXAMPLE_ROWS, imile, spoke);
function stopOf(r: typeof base, waybill: string) {
  const s = r.stops.find((st) => st.packages.some((p) => p.waybill === waybill));
  if (!s) throw new Error(`parada do ${waybill} não encontrada`);
  return s;
}
const edit = (waybill: string, line1: string, line2?: string) =>
  buildRoute(editPackages(base.packages, [waybill], { line1, line2 }), base.noAddress, spoke);

describe('editar o endereço de uma parada', () => {
  it('põe o número que faltava, tira o aviso e continua 10 pacotes / 8 paradas', () => {
    const r = edit('49600000000055', 'Rua dos Testes, 50');
    const s = stopOf(r, '49600000000055');
    expect(s).toMatchObject({ line1: 'Rua dos Testes, 50', line2: 'Consultório odontológico', edited: true, warnings: [] });
    expect(s.notes).toBe('0055 | 1 pacote: 49600000000055 (Consultório odontológico)');
    expect(r.check).toMatchObject({ ok: true, total: 10, stops: 8 });
    expect(readSheets(r.sheet)[0][3]?.[0]).toBe('Rua dos Testes, 50');
  });

  it('troca o complemento quando a parada tem um pacote só', () => {
    const r = edit('3320000000077', 'Rua Modelo, 343', 'Loja');
    expect(stopOf(r, '3320000000077')).toMatchObject({ line1: 'Rua Modelo, 343', line2: 'Loja', warnings: [] });
    expect(r.check.ok).toBe(true);
  });

  it('parada com vários pacotes: muda a rua de todos e cada um mantém o seu complemento', () => {
    const all = ['3320000000011', '3320000000022', '3320000000033'];
    const r = buildRoute(editPackages(base.packages, all, { line1: 'Rua das Flores, 122' }), [], spoke);
    expect(stopOf(r, '3320000000011')).toMatchObject({ line1: 'Rua das Flores, 122', line2: 'apto 302 / Loja Exemplo / Apartamento 1001', edited: true });
    expect(r.check).toMatchObject({ ok: true, total: 10, stops: 8 });
  });

  it('só muda os pacotes indicados', () => {
    const r = edit('3320000000011', 'Rua das Flores, 122');
    expect(stopOf(r, '3320000000022')).toMatchObject({ line1: 'Rua das Flores, 120', edited: false });
    expect(r.stops).toHaveLength(9);
    expect(r.check.ok).toBe(true);
  });

  it('mantém o aviso se o endereço editado continua sem número', () => {
    const s = stopOf(edit('49600000000055', 'Rua dos Testes'), '49600000000055');
    expect(s.edited).toBe(true);
    expect(s.warnings.map((w) => w.kind)).toEqual(['noNumber']);
  });

  it('tira o aviso de endereço corrigido, porque o entregador conferiu', () => {
    expect(stopOf(edit('49600000000066', 'Marechal Exemplo, 430', 'apto 91'), '49600000000066').warnings).toEqual([]);
  });

  it('junta numa parada só quando o endereço editado fica igual a outro do mesmo CEP', () => {
    const h = Object.values(imile.columns);
    const row = (w: string, addr: string) => {
      const r: string[] = h.map(() => '');
      const set = (k: keyof typeof imile.columns, v: string) => (r[h.indexOf(imile.columns[k])] = v);
      set('waybill', w); set('zip', '80000-010'); set('state', 'Paraná'); set('city', 'Curitiba'); set('area', 'Centro');
      set('address', addr); set('lat', '0'); set('lon', '0');
      return r;
    };
    const r0 = convertRows([h, row('3320000000501', 'Rua Inventada'), row('3320000000502', 'Rua Inventada 10')], imile, spoke);
    expect(r0.stops).toHaveLength(2);
    const r = buildRoute(editPackages(r0.packages, ['3320000000501'], { line1: 'Rua Inventada, 10' }), [], spoke);
    expect(r.stops).toHaveLength(1);
    expect(r.stops[0].packages).toHaveLength(2);
    expect(r.check).toMatchObject({ ok: true, total: 2, stops: 1 });
  });

  it('a conferência usa o número digitado, não o da planilha', () => {
    // trocar 45 por 47 não é "número sumido"
    expect(edit('3320000000044', 'Avenida Exemplo, 47').check.ok).toBe(true);
    // mas se o arquivo perder o número digitado, a conferência barra
    const edited = editPackages(base.packages, ['49600000000055'], { line1: 'Rua dos Testes, 50' });
    const stale = verify(buildRouteSheet(base.stops, spoke), edited, spoke);
    expect(stale.ok).toBe(false);
    expect(stale.errors).toContain('No pacote final 0055 sumiu o número 50 do endereço.');
  });

  // Teste na rua: "Avenida X 3070" digitado sem vírgula perdeu o número no Spoke
  it('põe a vírgula antes do número quando o entregador digita sem', () => {
    const s = stopOf(edit('49600000000055', 'Rua dos Testes 50'), '49600000000055');
    expect(s.line1).toBe('Rua dos Testes, 50');
    expect(withNumberComma('Rua dos Testes 50A')).toBe('Rua dos Testes, 50A');
    expect(withNumberComma('Rua dos Testes, 50')).toBe('Rua dos Testes, 50');
    expect(withNumberComma('Rua dos Testes 50 fundos')).toBe('Rua dos Testes 50 fundos'); // número no meio: deixa como está
    expect(withNumberComma('Rodovia BR 116')).toBe('Rodovia BR 116');
    expect(withNumberComma('Rua 7 100')).toBe('Rua 7, 100'); // número no nome da rua
    expect(withNumberComma('SC 401 7000')).toBe('SC 401, 7000');
    expect(withNumberComma('Rua dos Testes')).toBe('Rua dos Testes');
  });

  it('não muda a lista original e recusa endereço vazio', () => {
    edit('49600000000055', 'Rua dos Testes, 50');
    expect(stopOf(base, '49600000000055').line1).toBe('Rua dos Testes');
    expect(() => editPackages(base.packages, ['49600000000055'], { line1: '   ' })).toThrow();
  });
});
