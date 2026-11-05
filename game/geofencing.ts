import { distanceMeters, nearestOnLine, type LngLat } from "./geo";

/** Soglie configurabili: valori iniziali da calibrare sul posto (spec §5). */
export const GEO_CONFIG = {
  /** Oltre questa accuratezza (m) una lettura non vale per sblocchi o deviazioni. */
  maxAccuracyMeters: 30,
  /** Letture attendibili consecutive per confermare l'arrivo. */
  arrivalReadings: 2,
  /** Distanza dal sentiero oltre la quale si conta una lettura "fuori rotta". */
  offRouteMeters: 50,
  /** Letture fuori rotta consecutive prima dell'avviso. */
  offRouteReadings: 3,
  /** Per rientrare in rotta serve tornare sotto questa distanza (isteresi). */
  backOnRouteMeters: 30,
};

export type GeoReading = { position: LngLat; accuracy: number; timestamp: number };

export type GeoState = {
  arrivalStreak: number;
  offRouteStreak: number;
  offRoute: boolean;
  lastReliable?: GeoReading;
};

export const initialGeoState: GeoState = { arrivalStreak: 0, offRouteStreak: 0, offRoute: false };

export type GeoEvaluation = {
  state: GeoState;
  reliable: boolean;
  distanceToTarget: number;
  distanceToRoute: number;
  /** Punto del sentiero più vicino: è il punto di rientro. */
  rejoinPoint: LngLat;
  arrived: boolean;
};

export function evaluateReading(
  prev: GeoState,
  reading: GeoReading,
  target: LngLat,
  radius: number,
  route: LngLat[],
  cfg = GEO_CONFIG,
): GeoEvaluation {
  const reliable = reading.accuracy <= cfg.maxAccuracyMeters;
  const distanceToTarget = distanceMeters(reading.position, target);
  const near = nearestOnLine(reading.position, route);
  const state: GeoState = { ...prev };

  if (reliable) {
    state.lastReliable = reading;
    state.arrivalStreak = distanceToTarget <= radius ? prev.arrivalStreak + 1 : 0;

    if (near.distance > cfg.offRouteMeters) state.offRouteStreak = prev.offRouteStreak + 1;
    else state.offRouteStreak = 0;

    if (!prev.offRoute && state.offRouteStreak >= cfg.offRouteReadings) state.offRoute = true;
    if (prev.offRoute && near.distance <= cfg.backOnRouteMeters) {
      state.offRoute = false;
      state.offRouteStreak = 0;
    }
  }
  // Le letture imprecise non azzerano né fanno avanzare i contatori:
  // il jitter GPS non deve generare falsi allarmi.

  return {
    state,
    reliable,
    distanceToTarget,
    distanceToRoute: near.distance,
    rejoinPoint: near.point,
    // Arrivo: più letture consecutive nel raggio, oppure una sola lettura
    // che cade nel raggio anche contando tutta l'incertezza GPS (telefono fermo
    // = poche letture nuove).
    arrived:
      !state.offRoute &&
      (state.arrivalStreak >= cfg.arrivalReadings || (reliable && distanceToTarget + reading.accuracy <= radius)),
  };
}
