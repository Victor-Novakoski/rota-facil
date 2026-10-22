/** Sem acentos, minúsculo e com espaços simples. Serve para comparar textos. */
export const plain = (s: unknown): string =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

export const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Final do rastreio que a etiqueta mostra em destaque. */
export const lastDigits = (waybill: string, n = 4): string => waybill.slice(-n);

export const digitsOf = (s: unknown): string[] => String(s ?? '').match(/\d+/g) ?? [];

/** Valor de célula como texto. Números inteiros grandes (rastreios) não viram notação científica. */
export function cellText(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return Number.isInteger(v) ? v.toFixed(0) : String(v);
  return String(v).trim();
}

/** CEP no formato 00000-000. Se não parecer CEP, devolve o texto original. */
export function normZip(v: unknown): string {
  const t = cellText(v);
  const d = t.replace(/\D/g, '');
  if (d.length === 8 || d.length === 7) {
    const p = d.padStart(8, '0');
    return `${p.slice(0, 5)}-${p.slice(5)}`;
  }
  return t;
}

/** Latitude ou longitude. "0", vazio ou inválido vira null. */
export function toCoord(v: unknown): number | null {
  const n = parseFloat(cellText(v).replace(',', '.'));
  return Number.isFinite(n) && n !== 0 ? n : null;
}
