import type { AddressEdit, Package } from './types';

/** Marca que a limpeza põe no complemento quando falta o número da casa. */
export const SEM_NUMERO = /\s*\(sem número\)$/;

const tidy = (s: string) => s.replace(/\s+/g, ' ').trim();

/**
 * Troca o endereço dos pacotes indicados pelo que o entregador digitou
 * (ex.: o número da casa que está na etiqueta e não veio na planilha).
 * Devolve uma lista nova; a original não muda. CEP, cidade e localização continuam os da planilha.
 */
export function editPackages(packages: Package[], waybills: string[], edit: AddressEdit): Package[] {
  const line1 = tidy(edit.line1);
  if (!line1) throw new Error('Endereço vazio');
  const noNumber = !/\d/.test(line1);
  const targets = new Set(waybills);
  return packages.map((p) => {
    if (!targets.has(p.waybill)) return p;
    const line2 = edit.line2 === undefined ? p.line2 : tidy(edit.line2);
    return {
      ...p,
      line1,
      line2: noNumber ? line2 : line2.replace(SEM_NUMERO, ''),
      edited: true,
      // o entregador conferiu: só sobra o aviso de sem número, se ainda faltar
      flags: { fixes: [], noNumber, reordered: false, dupRemoved: false },
    };
  });
}
