import { findDuplicates } from './duplicates';
import { groupStops } from './group';
import { markFarStops } from './far';
import { checkFileSize, checkRowCount } from './limits';
import { pickSheet, readPackages } from './read';
import { readSheets, writeSheet } from './spreadsheet';
import type { CarrierProfile, Package, RouteAppProfile, RouteResult, Stop } from './types';
import { verify } from './verify';

export * from './types';
export { checkFileSize, MAX_FILE_BYTES, MAX_ROWS } from './limits';
export { cleanAddress, STREET_FIXES } from './address';
export { editPackages } from './edit';
export { FAR_FACTOR, FAR_MIN_KM } from './far';
export { CARRIERS, findCarrier } from './carriers';
export { ROUTE_APPS, findRouteApp } from './route-apps';

export function buildRouteSheet(stops: Stop[], app: RouteAppProfile): ArrayBuffer {
  const widths = app.headers.map((h) => (h === 'Notes' ? 70 : h.startsWith('Address') ? 34 : 14));
  return writeSheet([app.headers, ...stops.map(app.toRow)], 'Paradas', widths);
}

/** Linhas já lidas -> paradas, arquivo pronto e conferência. */
export function convertRows(rows: unknown[][], carrier: CarrierProfile, app: RouteAppProfile): RouteResult {
  checkRowCount(rows.length);
  const { packages, noAddress } = readPackages(rows, carrier);
  return buildRoute(packages, noAddress, app);
}

/** Pacotes já limpos (ou editados) -> paradas, arquivo pronto e conferência. */
export function buildRoute(packages: Package[], noAddress: string[], app: RouteAppProfile): RouteResult {
  const stops = markFarStops(groupStops(packages));
  const sheet = buildRouteSheet(stops, app);
  const check = verify(sheet, packages, app);
  return { packages, noAddress, stops, duplicates: findDuplicates(stops), sheet, check };
}

/** Arquivo da transportadora -> paradas, arquivo pronto e conferência. */
export function convertFile(data: ArrayBuffer, carrier: CarrierProfile, app: RouteAppProfile): RouteResult {
  checkFileSize(data.byteLength);
  return convertRows(pickSheet(readSheets(data), carrier), carrier, app);
}
