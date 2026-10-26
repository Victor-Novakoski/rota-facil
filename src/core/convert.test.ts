import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { convertFile, convertRows, findCarrier, findRouteApp, FriendlyError } from '.';
import { readSheets } from './spreadsheet';

const imile = findCarrier('imile');
const spoke = findRouteApp('spoke');
const load = (p: string) => {
  const b = readFileSync(p);
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
};

describe('planilha de exemplo (10 entregas inventadas)', () => {
  const r = convertFile(load('src/core/fixtures/exemplo-imile-ficticio.xlsx'), imile, spoke);

  it('gera 8 paradas com 10 pacotes e passa na conferência', () => {
    expect(r.packages).toHaveLength(10);
    expect(r.stops).toHaveLength(8);
    expect(r.check).toMatchObject({ ok: true, errors: [], total: 10, stops: 8 });
    expect(r.noAddress).toEqual([]);
  });

  it('junta os 3 pacotes da Rua das Flores 120', () => {
    const s = r.stops[0];
    expect(s.line1).toBe('Rua das Flores, 120');
    expect(s.line2).toBe('apto 302 / Loja Exemplo / Apartamento 1001');
    expect(s.notes).toBe('0011, 0022, 0033 | 3 PACOTES: 3320000000011 (apto 302) ; 3320000000022 (Loja Exemplo) ; 3320000000033 (Apartamento 1001)');
  });

  it('mostra os avisos esperados', () => {
    const kinds = r.stops.map((s) => s.warnings.map((w) => w.kind));
    expect(kinds).toEqual([[], [], ['noNumber'], ['reordered'], ['noNumber'], ['noCoords'], [], ['reordered']]);
  });

  it('grava o arquivo com os cabeçalhos exatos do Spoke', () => {
    const rows = readSheets(r.sheet)[0];
    expect(rows[0]).toEqual(spoke.headers);
    expect(rows[6]).toEqual(['Rua Sem Mapa, 128', 'Cartório', 'Curitiba', 'Paraná', '80000-006', 'Brasil', '', '', 1, '0088 | 1 pacote: 3320000000088 (Cartório)']);
  });
});

describe('erros amigáveis', () => {
  it('diz quais colunas faltam e não gera nada', () => {
    try {
      convertRows([['Waybill No', 'Endereco'], ['1', 'x']], imile, spoke);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(FriendlyError);
      expect((e as FriendlyError).details).toContain('Consignee Address');
    }
  });

  it('avisa planilha vazia', () => {
    expect(() => convertRows([Object.values(imile.columns)], imile, spoke)).toThrow(FriendlyError);
  });

  it('junta o mesmo endereço escrito abreviado e por extenso', () => {
    const h = ['Waybill No', 'Consignee Zip Code', 'Consignee Province', 'Consignee City', 'Consignee Area', 'Consignee Address', 'Delivery Associate', 'Consignee Longitude', 'Consignee Latitude'];
    const row = (w: string, addr: string) => [w, '80000-011', 'Paraná', 'Curitiba', 'Centro', addr, 'X', '0', '0'];
    const r = convertRows([h, row('3320000000601', 'R. Cel. Inventado 100 ap 1'), row('3320000000602', 'Rua Coronel Inventado 100 ap 2')], imile, spoke);
    expect(r.stops).toHaveLength(1);
    expect(r.stops[0]).toMatchObject({ line1: 'Rua Coronel Inventado, 100', line2: 'ap 1 / ap 2' });
    expect(r.check.ok).toBe(true);
  });

  it('separa pacote sem endereço', () => {
    const h = ['Waybill No', 'Consignee Zip Code', 'Consignee Province', 'Consignee City', 'Consignee Area', 'Consignee Address', 'Delivery Associate', 'Consignee Longitude', 'Consignee Latitude'];
    const r = convertRows([h, ['3320000000999', '80000-009', 'Paraná', 'Curitiba', 'Centro', '', 'X', '0', '0'], ['3320000000998', '80000-009', 'Paraná', 'Curitiba', 'Centro', 'Rua A 1', 'X', '0', '0']], imile, spoke);
    expect(r.noAddress).toEqual(['3320000000999']);
    expect(r.check.ok).toBe(true);
  });
});

// Planilha real: NUNCA vai para o repositório. Para testar no seu computador:
//   REAL_SHEET="/caminho/planilha.xlsx" REAL_EXPECT="57/46" npm test
const real = process.env.REAL_SHEET ?? '';
describe.skipIf(!existsSync(real))('planilha real (fora do repositório)', () => {
  it('confere pacotes e paradas', () => {
    const r = convertFile(load(real), imile, spoke);
    expect(r.check.errors).toEqual([]);
    if (process.env.REAL_EXPECT) expect(`${r.packages.length}/${r.stops.length}`).toBe(process.env.REAL_EXPECT);
  });
});

// Endereços inventados que repetem o que apareceu no teste na rua
describe('faixa do CEP e parênteses na rua', () => {
  const h = Object.values(imile.columns);
  const row = (w: string, addr: string) => {
    const r: string[] = h.map(() => '');
    const set = (k: keyof typeof imile.columns, v: string) => (r[h.indexOf(imile.columns[k])] = v);
    set('waybill', w); set('zip', '80000-020'); set('state', 'Paraná'); set('city', 'Curitiba'); set('area', 'Centro');
    set('address', addr); set('lat', '-25.43'); set('lon', '-49.27');
    return r;
  };
  const r = convertRows([
    h,
    row('49600000000701', 'Avenida Inventada- de 1001/1002 a 2999/3000 Apto 1305 2500'),
    row('49600000000702', 'Avenida Inventada- de 1001/1002 a 2999/3000 edificio azul, apto 904'),
    row('3320000000703', 'Rua Exemplo (Torre Azul) 117 Ap 1020'),
  ], imile, spoke);

  it('tira a faixa do arquivo, avisa e passa na conferência', () => {
    const rows = readSheets(r.sheet)[0];
    expect(rows.slice(1).map((x) => [x[0], x[1]])).toEqual([
      ['Avenida Inventada, 2500', 'Apto 1305'],
      ['Avenida Inventada', 'edificio azul apto 904 (sem número)'],
      ['Rua Exemplo, 117', 'Torre Azul Ap 1020'],
    ]);
    expect(r.stops.map((s) => s.warnings.map((w) => w.kind))).toEqual([['reordered', 'zipRange'], ['noNumber', 'zipRange'], []]);
    expect(r.check).toMatchObject({ ok: true, errors: [], total: 3, stops: 3 });
  });
});

describe('pacotes sem número na mesma rua e CEP', () => {
  const h = Object.values(imile.columns);
  const row = (w: string, addr: string, lat: string, lon: string) => {
    const r: string[] = h.map(() => '');
    const set = (k: keyof typeof imile.columns, v: string) => (r[h.indexOf(imile.columns[k])] = v);
    set('waybill', w); set('zip', '80000-030'); set('state', 'Paraná'); set('city', 'Curitiba'); set('area', 'Centro');
    set('address', addr); set('lat', lat); set('lon', lon);
    return r;
  };

  it('só junta quando o ponto no mapa é o mesmo', () => {
    const r = convertRows([
      h,
      row('49600000000801', 'Rua Fictícia Apto 132', '-25.4343', '-49.2820'),
      row('49600000000802', 'Rua Fictícia Apto 132', '-25.4343', '-49.2820'),
      row('6100000000803', 'Rua Fictícia', '-25.4240', '-49.2869'), // outra casa, mais adiante na rua
    ], imile, spoke);
    expect(r.stops.map((s) => s.packages.length)).toEqual([2, 1]);
    expect(r.check).toMatchObject({ ok: true, total: 3, stops: 2 });
  });

  it('sem ponto no mapa continua juntando pela rua e CEP', () => {
    const r = convertRows([h, row('3320000000804', 'Rua Fictícia', '0', '0'), row('3320000000805', 'Rua Fictícia', '0', '0')], imile, spoke);
    expect(r.stops).toHaveLength(1);
  });
});

describe('rua com número no nome', () => {
  const h = Object.values(imile.columns);
  const row = (w: string, addr: string) => {
    const r: string[] = h.map(() => '');
    const set = (k: keyof typeof imile.columns, v: string) => (r[h.indexOf(imile.columns[k])] = v);
    set('waybill', w); set('zip', '80000-040'); set('state', 'Paraná'); set('city', 'Curitiba'); set('area', 'Centro');
    set('address', addr); set('lat', '0'); set('lon', '0');
    return r;
  };

  it('casas diferentes da "Rua 7" ficam em paradas diferentes', () => {
    const r = convertRows([h, row('3320000000901', 'Rua 7, 100'), row('3320000000902', 'Rua 7, 200'), row('3320000000903', 'Rua 7 100 casa 2')], imile, spoke);
    expect(r.stops.map((s) => [s.line1, s.packages.length])).toEqual([['Rua 7, 100', 2], ['Rua 7, 200', 1]]);
    expect(r.check).toMatchObject({ ok: true, total: 3, stops: 2 });
  });
});
