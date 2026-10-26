import type { Package } from '../core/types';
import { today } from './lib';

/**
 * A conferência do dia guardada no próprio celular, para não perder as edições se a página recarregar
 * (puxar a tela para baixo, o Android fechar o app, uma atualização). Nada sai do aparelho.
 * Vale só no dia em que foi aberta: no dia seguinte, ou ao abrir outra planilha, é apagada.
 */
export interface SavedReview {
  day: string;
  carrierId: string;
  fileName: string;
  packages: Package[];
  noAddress: string[];
  checked: string[];
  apart: string[];
}

const KEY = 'rota-facil:conferencia';
const VERSION = 1;

export function saveReview(review: Omit<SavedReview, 'day'>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: VERSION, day: today().iso, ...review }));
  } catch {
    /* sem espaço ou navegador sem armazenamento: segue só na memória */
  }
}

export function clearReview() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nada guardado */
  }
}

/** A conferência guardada hoje, ou nada. A de outro dia é apagada aqui mesmo. */
export function readReview(): SavedReview | null {
  let saved: unknown;
  try {
    saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
  } catch {
    saved = null;
  }
  if (!saved || typeof saved !== 'object') return null;
  const s = saved as Partial<SavedReview> & { v?: number };
  const valid = s.v === VERSION && typeof s.carrierId === 'string' && typeof s.fileName === 'string' &&
    Array.isArray(s.packages) && Array.isArray(s.noAddress) && Array.isArray(s.checked) && Array.isArray(s.apart);
  if (!valid || s.day !== today().iso) {
    clearReview();
    return null;
  }
  return s as SavedReview;
}
