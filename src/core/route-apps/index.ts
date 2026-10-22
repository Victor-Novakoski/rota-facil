import type { RouteAppProfile } from '../types';
import { spoke } from './spoke';

/** Apps de rota disponíveis. Para adicionar um novo (Circuit, Google Maps), crie o arquivo dele e coloque aqui. */
export const ROUTE_APPS: RouteAppProfile[] = [spoke];

export const findRouteApp = (id: string | null | undefined): RouteAppProfile =>
  ROUTE_APPS.find((a) => a.id === id) ?? ROUTE_APPS[0];
