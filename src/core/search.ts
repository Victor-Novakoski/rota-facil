import type { Stop } from './types';

/** Menos que isso casa com pacotes demais para ajudar. */
export const MIN_SEARCH_DIGITS = 3;

export interface FinalMatch {
  stop: Stop;
  /** Rastreios desta parada que terminam com o que foi digitado. */
  waybills: string[];
}

/**
 * Acha as paradas pelo final do rastreio, que a etiqueta mostra em destaque.
 * Aceita o rastreio inteiro também. Pode achar mais de uma parada quando dois pacotes têm o mesmo final.
 */
export function findByFinal(stops: Stop[], query: string): FinalMatch[] {
  const q = query.replace(/\D/g, '');
  if (q.length < MIN_SEARCH_DIGITS) return [];
  return stops
    .map((stop) => ({ stop, waybills: stop.packages.map((p) => p.waybill).filter((w) => w.endsWith(q)) }))
    .filter((m) => m.waybills.length > 0);
}
