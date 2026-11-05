import { routeSlice, type Mission } from "./content";
import { distanceMeters, nearestOnLine, type LngLat } from "./geo";

/** Oltre questa distanza dal vialetto la guida porta prima al vialetto. */
export const ON_TRAIL_METERS = 20;
/** Più lontano di così si considera fuori dal parco: niente guida. */
export const FAR_AWAY_METERS = 1500;

export type Guidance = {
  /** direzione da seguire, in gradi dal nord in senso orario */
  bearing: number;
  /** metri fino al vialetto (0 se ci siete già) */
  toTrail: number;
  /** metri lungo il vialetto fino alla tappa */
  alongTrail: number;
  /** punto del vialetto da raggiungere per primo */
  trailPoint: LngLat;
  /** tratto di vialetto ancora da fare, dal punto più vicino alla tappa */
  path: LngLat[];
  farAway: boolean;
};

export function bearingDeg(a: LngLat, b: LngLat): number {
  const r = Math.PI / 180;
  const y = Math.sin((b[0] - a[0]) * r) * Math.cos(b[1] * r);
  const x = Math.cos(a[1] * r) * Math.sin(b[1] * r) - Math.sin(a[1] * r) * Math.cos(b[1] * r) * Math.cos((b[0] - a[0]) * r);
  return ((Math.atan2(y, x) / r) + 360) % 360;
}

/** Punto a `ahead` metri più avanti lungo una polilinea. */
function pointAhead(path: LngLat[], ahead: number): LngLat {
  let left = ahead;
  for (let i = 0; i < path.length - 1; i++) {
    const d = distanceMeters(path[i], path[i + 1]);
    if (d >= left && d > 0) {
      const t = left / d;
      return [path[i][0] + (path[i + 1][0] - path[i][0]) * t, path[i][1] + (path[i + 1][1] - path[i][1]) * t];
    }
    left -= d;
  }
  return path[path.length - 1];
}

/**
 * Indica dove andare seguendo i vialetti del percorso: prima verso il punto
 * del vialetto più vicino (nel tratto della tappa in corso), poi lungo il
 * vialetto fino al punto di sosta.
 */
export function guide(position: LngLat, mission: Mission, route: LngLat[]): Guidance {
  const near = nearestOnLine(position, route, mission.leg.fromSegment, mission.leg.toSegment);
  const path = routeSlice(near.along, mission.leg.endAlong);
  const alongTrail = Math.max(0, mission.leg.endAlong - near.along);
  const farAway = near.distance > FAR_AWAY_METERS;
  const onTrail = near.distance <= ON_TRAIL_METERS;
  const target = onTrail ? pointAhead(path, Math.min(25, alongTrail)) : near.point;
  const bearing = distanceMeters(position, target) < 2 ? bearingDeg(position, mission.safeStop) : bearingDeg(position, target);
  return { bearing, toTrail: onTrail ? 0 : near.distance, alongTrail, trailPoint: near.point, path, farAway };
}

const CARDINALS = ["nord", "nord-est", "est", "sud-est", "sud", "sud-ovest", "ovest", "nord-ovest"];
export const cardinal = (deg: number) => CARDINALS[Math.round(deg / 45) % 8];
