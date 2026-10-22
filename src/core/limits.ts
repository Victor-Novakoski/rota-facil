import { FriendlyError } from './types';

// Limites para um arquivo estranho não travar o celular.
// A planilha real de um dia (57 pacotes) tem uns 9 KB; os limites ficam muito acima disso.

/** Tamanho máximo do arquivo escolhido: 5 MB. */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

/** Máximo de linhas lidas de cada aba (um dia tem dezenas ou poucas centenas). */
export const MAX_ROWS = 5000;

/** Recusa arquivo grande demais antes de ler. */
export function checkFileSize(bytes: number): void {
  if (bytes > MAX_FILE_BYTES) {
    const mb = (bytes / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
    throw new FriendlyError(
      `Esse arquivo é grande demais (${mb} MB). A planilha do dia costuma ter bem menos de 1 MB. Confira se escolheu o arquivo certo. Nenhum arquivo foi gerado.`,
    );
  }
}

/** Recusa planilha com linhas demais. */
export function checkRowCount(rows: number): void {
  if (rows > MAX_ROWS) {
    throw new FriendlyError(
      `Essa planilha tem mais de ${MAX_ROWS.toLocaleString('pt-BR')} linhas, muito mais do que as entregas de um dia. Confira se escolheu o arquivo certo. Nenhum arquivo foi gerado.`,
    );
  }
}
