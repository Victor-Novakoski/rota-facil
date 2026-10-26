import { FriendlyError } from '../core/types';

/**
 * Partes do app que só carregam quando precisam (o motor e o PDF).
 * Se o app foi atualizado com a tela aberta, a parte antiga já não existe no site e o carregamento falha.
 * Nesse caso a mensagem pede para fechar e abrir, em vez de culpar a planilha. Nunca recarrega sozinho,
 * para não perder as edições da conferência.
 */
export const UPDATED_MESSAGE = 'O Rota Fácil foi atualizado enquanto estava aberto. Feche e abra o app de novo para continuar.';

export async function loadPart<T>(importer: () => Promise<T>): Promise<T> {
  try {
    return await importer();
  } catch (e) {
    console.error(e);
    throw new FriendlyError(UPDATED_MESSAGE);
  }
}

export const loadCore = () => loadPart(() => import('../core'));
export const loadPdf = () => loadPart(() => import('../core/pdf'));
