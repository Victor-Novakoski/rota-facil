import { groupStops } from './group';
import { pickSheet, readPackages } from './read';
import { readSheets, writeSheet } from './spreadsheet';
import type { CarrierProfile, RouteAppProfile, RouteResult, Stop } from './types';
import { verify } from './verify';

export * from './types';
export { cleanAddress, STREET_FIXES } from './address';
export { CARRIERS, findCarrier } from './carriers';
export { ROUTE_APPS, findRouteApp } from './route-apps';

export function buildRouteSheet(stops: Stop[], app: RouteAppProfile): ArrayBuffer {
  const widths = app.headers.map((h) => (h === 'Notes' ? 70 : h.startsWith('Address') ? 34 : 14));
  return writeSheet([app.headers, ...stops.map(app.toRow)], 'Paradas', widths);
}

/** Linhas já lidas -> paradas, arquivo pronto e conferência. */
export function convertRows(rows: unknown[][], carrier: CarrierProfile, app: RouteAppProfile): RouteResult {
  const { packages, noAddress } = readPackages(rows, carrier);
  const stops = groupStops(packages);
  const sheet = buildRouteSheet(stops, app);
  const check = verify(sheet, packages, app);
  return { packages, noAddress, stops, sheet, check };
}

/** Arquivo da transportadora -> paradas, arquivo pronto e conferência. */
export function convertFile(data: ArrayBuffer, carrier: CarrierProfile, app: RouteAppProfile): RouteResult {
  return convertRows(pickSheet(readSheets(data), carrier), carrier, app);
}
