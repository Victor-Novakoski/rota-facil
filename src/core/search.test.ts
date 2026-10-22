import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { convertFile, findCarrier, findRouteApp } from '.';
import { findByFinal } from './search';

const b = readFileSync('src/core/fixtures/exemplo-imile-ficticio.xlsx');
const data = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
const { stops } = convertFile(data, findCarrier('imile'), findRouteApp('spoke'));

describe('busca pelo final do rastreio', () => {
  it('acha a parada pelos 4 últimos dígitos', () => {
    const found = findByFinal(stops, '0022');
    expect(found).toHaveLength(1);
    expect(found[0].stop.line1).toBe('Rua das Flores, 120');
    expect(found[0].waybills).toEqual(['3320000000022']);
  });

  it('aceita o rastreio inteiro e ignora espaços e traços', () => {
    expect(findByFinal(stops, '3320000000088')[0].stop.line1).toBe('Rua Sem Mapa, 128');
    expect(findByFinal(stops, ' 00-88 ')[0].stop.line1).toBe('Rua Sem Mapa, 128');
  });

  it('não busca com menos de 3 dígitos', () => {
    expect(findByFinal(stops, '88')).toEqual([]);
    expect(findByFinal(stops, '')).toEqual([]);
  });

  it('não acha nada quando nenhum pacote termina assim', () => {
    expect(findByFinal(stops, '9999')).toEqual([]);
  });

  it('mostra todas as paradas quando dois pacotes têm o mesmo final', () => {
    const twin = { ...stops[1], packages: [{ ...stops[1].packages[0], waybill: '7770000000022' }] };
    const found = findByFinal([...stops, twin], '0022');
    expect(found.map((m) => m.waybills)).toEqual([['3320000000022'], ['7770000000022']]);
  });
});
