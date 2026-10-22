// Único lugar que conversa com a biblioteca de planilhas (SheetJS).
// Se um dia trocar a biblioteca ou a versão, só este arquivo muda.
import * as XLSX from 'xlsx';
import { MAX_ROWS } from './limits';
import type { Cell } from './types';

export type Rows = unknown[][];

/**
 * Lê um arquivo .xlsx/.xls e devolve as abas como listas de linhas.
 * Lê no máximo MAX_ROWS + 1 linhas por aba: a linha a mais serve para avisar que passou do limite.
 */
export function readSheets(data: ArrayBuffer): Rows[] {
  const wb = XLSX.read(data, { type: 'array', sheetRows: MAX_ROWS + 1 });
  return wb.SheetNames.map((n) => XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[n], { header: 1, raw: true, defval: '' }));
}

/** Monta um .xlsx de uma aba só. */
export function writeSheet(rows: Cell[][], sheetName: string, widths: number[] = []): ArrayBuffer {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  if (widths.length) ws['!cols'] = widths.map((wch) => ({ wch }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
}
