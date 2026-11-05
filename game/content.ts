import missionsJson from "@/content/missions.it.json";
import routeJson from "@/content/route.geo.json";
import { lineLength, nearestOnLine, type LngLat } from "./geo";

export type Hint = { id: string; text: string; audioSrc?: string; afterSeconds?: number; withinMeters?: number };
export type Activity = {
  type: "observe" | "repeat" | "choice";
  prompt: string;
  options?: string[];
  correctOption?: number;
  adultNote?: string;
};
export type Mission = {
  id: string;
  order: number;
  title: string;
  character: string;
  rewardId: string;
  activationRadiusMeters: number;
  safeStopDescription: string;
  introductionText: string;
  introductionAudioSrc?: string;
  activity: Activity;
  conclusionText: string;
  hints: Hint[];
  /** Punto segnato sulla mappa (elemento da cercare). */
  location: LngLat;
  /** Punto sul percorso dove sostare: è qui che si misura l'arrivo. */
  safeStop: LngLat;
  /** Tratto di percorso che porta a questa tappa (indici dei segmenti). */
  leg: { fromSegment: number; toSegment: number; startAlong: number; endAlong: number };
  verifiedOnSite: boolean;
};
export type Reward = { name: string; emoji: string };

type Feature = {
  properties: { id: string; name?: string; verifiedOnSite?: boolean };
  geometry: { type: string; coordinates: unknown };
};

const features = (routeJson as { features: Feature[] }).features;
const routeFeature = features.find((f) => f.geometry.type === "LineString");
if (!routeFeature) throw new Error("route.geojson: manca il LineString del percorso");

export const route = routeFeature.geometry.coordinates as LngLat[];
export const routeLength = lineLength(route);
export const routeVerified = routeFeature.properties.verifiedOnSite === true;

const points = new Map(
  features
    .filter((f) => f.geometry.type === "Point")
    .map((f) => [f.properties.id, { coord: f.geometry.coordinates as LngLat, verified: f.properties.verifiedOnSite === true }]),
);

const start = points.get("start");
if (!start) throw new Error("route.geojson: manca il punto di partenza (id 'start')");
export const startPoint = start.coord;

const raw = missionsJson as unknown as {
  prologue: { title: string; text: string; audioSrc?: string };
  missions: Omit<Mission, "location" | "safeStop" | "leg" | "verifiedOnSite">[];
  rewards: Record<string, Reward>;
  finale: { title: string; text: string; audioSrc?: string };
};

// Le tappe si agganciano al percorso in sequenza: il tracciato ripassa sugli
// stessi viali (Bastia → Faggio → Bastia), quindi la ricerca riparte sempre
// dal segmento della tappa precedente.
let prevSegment = 0;
let prevAlong = 0;
export const missions: Mission[] = [...raw.missions]
  .sort((a, b) => a.order - b.order)
  .map((m) => {
    const p = points.get(m.id);
    if (!p) throw new Error(`route.geojson: manca il punto della tappa ${m.id}`);
    const near = nearestOnLine(p.coord, route, prevSegment);
    const leg = { fromSegment: prevSegment, toSegment: near.segmentIndex, startAlong: prevAlong, endAlong: near.along };
    prevSegment = near.segmentIndex;
    prevAlong = near.along;
    return { ...m, location: p.coord, safeStop: near.point, leg, verifiedOnSite: p.verified };
  });

export const prologue = raw.prologue;
export const finale = raw.finale;
export const rewards = raw.rewards;
export const allVerified = routeVerified && missions.every((m) => m.verifiedOnSite) && start.verified;

/** Porzione di percorso tra due progressive (per evidenziare il tratto in corso). */
export function routeSlice(fromAlong: number, toAlong: number): LngLat[] {
  const out: LngLat[] = [];
  let acc = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i];
    const b = route[i + 1];
    const len = lineLength([a, b]);
    const s = acc;
    const e = acc + len;
    if (e >= fromAlong && s <= toAlong) {
      const lerp = (t: number): LngLat => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      const t0 = len ? Math.max(0, (fromAlong - s) / len) : 0;
      const t1 = len ? Math.min(1, (toAlong - s) / len) : 1;
      if (!out.length) out.push(lerp(t0));
      out.push(lerp(t1));
    }
    acc = e;
  }
  return out;
}
