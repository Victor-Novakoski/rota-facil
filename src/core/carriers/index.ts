import type { CarrierProfile } from '../types';
import { imile } from './imile';

/** Transportadoras disponíveis. Para adicionar uma nova, crie o arquivo dela e coloque aqui. */
export const CARRIERS: CarrierProfile[] = [imile];

export const findCarrier = (id: string | null | undefined): CarrierProfile =>
  CARRIERS.find((c) => c.id === id) ?? CARRIERS[0];
