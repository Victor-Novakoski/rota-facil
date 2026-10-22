import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { convertFile, convertRows, findCarrier, findRouteApp, FriendlyError } from '../src/core';
import { readSheets } from '../src/core/spreadsheet';

const imile = findCarrier('imile');
const spoke = findRouteApp('spoke');
const load = (p: string) => {
  const b = readFileSync(p);
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
};

describe('planilha de exemplo (10 entregas inventadas)', () => {
  const r = convertFile(load('tests/fixtures/exemplo-imile-ficticio.xlsx'), imile, spoke);

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
    expect(s.notes).toBe('3 PACOTES: 3320000000011 (apto 302) ; 3320000000022 (Loja Exemplo) ; 3320000000033 (Apartamento 1001)');
  });

  it('mostra os avisos esperados', () => {
    const kinds = r.stops.map((s) => s.warnings.map((w) => w.kind));
    expect(kinds).toEqual([[], [], ['noNumber'], ['reordered'], ['noNumber'], ['noCoords'], [], ['reordered']]);
  });

  it('grava o arquivo com os cabeçalhos exatos do Spoke', () => {
    const rows = readSheets(r.sheet)[0];
    expect(rows[0]).toEqual(spoke.headers);
    expect(rows[6]).toEqual(['Rua Sem Mapa, 128', 'Cartório', 'Curitiba', 'Paraná', '80000-006', 'Brasil', '', '', 1, '1 pacote: 3320000000088 (Cartório)']);
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

  it('separa pacote sem endereço', () => {
    const h = ['Waybill No', 'Consignee Zip Code', 'Consignee Province', 'Consignee City', 'Consignee Area', 'Consignee Address', 'Delivery Associate', 'Consignee Longitude', 'Consignee Latitude'];
    const r = convertRows([h, ['3320000000999', '80000-009', 'Paraná', 'Curitiba', 'Centro', '', 'X', '0', '0'], ['3320000000998', '80000-009', 'Paraná', 'Curitiba', 'Centro', 'Rua A 1', 'X', '0', '0']], imile, spoke);
    expect(r.noAddress).toEqual(['3320000000999']);
    expect(r.check.ok).toBe(true);
  });
});

// Planilha real: NUNCA vai para o repositório. Para testar no seu computador:
//   REAL_SHEET="/caminho/planilha.xlsx" REAL_EXPECT="57/46" npm test
const real = process.env.REAL_SHEET;
describe.skipIf(!real || !existsSync(real))('planilha real (fora do repositório)', () => {
  it('confere pacotes e paradas', () => {
    const r = convertFile(load(real!), imile, spoke);
    expect(r.check.errors).toEqual([]);
    if (process.env.REAL_EXPECT) expect(`${r.packages.length}/${r.stops.length}`).toBe(process.env.REAL_EXPECT);
  });
});
