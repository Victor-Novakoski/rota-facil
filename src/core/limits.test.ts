import { describe, expect, it } from 'vitest';
import { convertFile, convertRows, findCarrier, findRouteApp, FriendlyError } from '.';
import { checkFileSize, MAX_FILE_BYTES, MAX_ROWS } from './limits';
import { writeSheet } from './spreadsheet';

const imile = findCarrier('imile');
const spoke = findRouteApp('spoke');

describe('limites de tamanho', () => {
  it('aceita arquivo de até 5 MB', () => {
    expect(() => checkFileSize(9_000)).not.toThrow();
    expect(() => checkFileSize(MAX_FILE_BYTES)).not.toThrow();
  });

  it('recusa arquivo maior que 5 MB com mensagem amigável', () => {
    expect(() => checkFileSize(MAX_FILE_BYTES + 1)).toThrow(FriendlyError);
    expect(() => checkFileSize(12 * 1024 * 1024)).toThrow('grande demais (12 MB)');
  });

  it('convertFile recusa arquivo grande sem tentar ler', () => {
    expect(() => convertFile(new ArrayBuffer(MAX_FILE_BYTES + 1), imile, spoke)).toThrow('grande demais');
  });

  it('recusa planilha com linhas demais', () => {
    const header = Object.values(imile.columns);
    const row = ['3320000000011', '80000-001', 'Paraná', 'Curitiba', 'Centro', 'Rua A 1', 'X', '-49.2', '-25.4'];
    const rows = [header, ...Array.from({ length: MAX_ROWS }, () => row)];
    expect(() => convertRows(rows, imile, spoke)).toThrow(FriendlyError);
    expect(() => convertRows(rows, imile, spoke)).toThrow('mais de 5.000 linhas');
  });

  it('a leitura do arquivo para no limite de linhas e avisa', () => {
    const header = Object.values(imile.columns);
    const row = ['3320000000011', '80000-001', 'Paraná', 'Curitiba', 'Centro', 'Rua A 1', 'X', '-49.2', '-25.4'];
    const file = writeSheet([header, ...Array.from({ length: MAX_ROWS + 50 }, () => row)], 'Sheet1');
    expect(() => convertFile(file, imile, spoke)).toThrow('mais de 5.000 linhas');
  });
});
