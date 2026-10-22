import { cleanAddress } from './address';
import type { Rows } from './spreadsheet';
import { FriendlyError, type CarrierProfile, type Package, type PackageField } from './types';
import { cellText, normZip, plain, toCoord } from './text';

/** Escolhe a aba que tem o cabeçalho da transportadora (ou a primeira). */
export function pickSheet(sheets: Rows[], carrier: CarrierProfile): Rows {
  const wanted = Object.values(carrier.columns).map(plain);
  return (
    sheets.find((rows) => rows.slice(0, 20).some((r) => (r ?? []).map(plain).filter((c) => wanted.includes(c)).length >= 3)) ??
    sheets[0] ??
    []
  );
}

/** Linhas da planilha -> pacotes com endereço limpo. */
export function readPackages(rows: Rows, carrier: CarrierProfile): { packages: Package[]; noAddress: string[] } {
  const fields = Object.keys(carrier.columns) as PackageField[];

  // o cabeçalho pode não estar na primeira linha
  let headerRow = -1;
  let best = 0;
  for (let r = 0; r < Math.min(rows.length, 20); r++) {
    const cells = (rows[r] ?? []).map(plain);
    const hits = fields.filter((f) => cells.includes(plain(carrier.columns[f]))).length;
    if (hits > best) { best = hits; headerRow = r; }
  }
  const header = headerRow >= 0 ? (rows[headerRow] ?? []).map(plain) : [];
  const idx = {} as Record<PackageField, number>;
  const missing: string[] = [];
  for (const f of fields) {
    const at = header.indexOf(plain(carrier.columns[f]));
    if (at === -1) missing.push(carrier.columns[f]);
    else idx[f] = at;
  }
  if (missing.length) {
    throw new FriendlyError(
      `Essa planilha não tem o formato esperado da ${carrier.name}. Nenhum arquivo foi gerado. Confira se escolheu a planilha certa. Faltam estas colunas:`,
      missing,
    );
  }

  const packages: Package[] = [];
  const noAddress: string[] = [];
  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const get = (f: PackageField) => row[idx[f]];
    const waybill = cellText(get('waybill')).replace(/\s+/g, '');
    if (!waybill) continue; // linha vazia
    const rawAddress = cellText(get('address'));
    if (!rawAddress) { noAddress.push(waybill); continue; }
    const area = cellText(get('area'));
    packages.push({
      waybill,
      rawAddress,
      area,
      zip: normZip(get('zip')),
      city: cellText(get('city')),
      state: cellText(get('state')),
      lat: toCoord(get('lat')),
      lon: toCoord(get('lon')),
      ...cleanAddress(rawAddress, area),
    });
  }
  if (!packages.length && !noAddress.length) {
    throw new FriendlyError('A planilha não tem nenhuma entrega. Confira se escolheu o arquivo do dia.');
  }
  return { packages, noAddress };
}
