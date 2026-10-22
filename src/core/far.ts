import type { Stop } from './types';

/** Abaixo disso nunca é "longe": rota de cidade vai de um bairro a outro sem aviso. */
export const FAR_MIN_KM = 15;
/** Longe = mais que este tanto de vezes a distância normal das paradas até o meio da rota. */
export const FAR_FACTOR = 4;
/** Com menos paradas no mapa não dá para saber o que é "normal". */
const MIN_POINTS = 3;

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Distância em km entre dois pontos (fórmula de haversine). */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

/**
 * Aviso amarelo para a parada com o ponto no mapa muito longe das outras
 * (ex.: a planilha pôs o ponto em outra cidade). O meio da rota é a mediana,
 * para um ponto errado não puxar o meio para perto dele.
 */
export function markFarStops(stops: Stop[]): Stop[] {
  const mapped = stops.filter((s) => s.lat !== null && s.lon !== null && !s.warnings.some((w) => w.kind === 'oddCoords'));
  if (mapped.length < MIN_POINTS) return stops;
  const lat = median(mapped.map((s) => s.lat as number));
  const lon = median(mapped.map((s) => s.lon as number));
  const dist = new Map(mapped.map((s) => [s, distanceKm(lat, lon, s.lat as number, s.lon as number)]));
  const limit = Math.max(FAR_MIN_KM, FAR_FACTOR * median([...dist.values()]));
  return stops.map((s) => {
    const d = dist.get(s);
    if (d === undefined || d <= limit) return s;
    const km = d < 100 ? Math.round(d) : Math.round(d / 10) * 10;
    const text = `Ponto no mapa longe das outras paradas (uns ${km} km). Pode estar em outra cidade. Confira antes de importar.`;
    return { ...s, warnings: [...s.warnings, { kind: 'farCoords', text }] };
  });
}
