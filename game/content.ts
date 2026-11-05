import missionsJson from "@/content/missions.it.json";
import routeJson from "@/content/route.geo.json";
import { lineLength, nearestOnLine, type LngLat } from "./geo";

/** Una battuta detta da un personaggio. `id` dà il nome al file audio: /audio/it/<id>.mp3 */
export type Line = { id: string; speaker: CharacterId; text: string; audioSrc: string };
export type CharacterId = "bastiano" | "fagiolina" | "rimario" | "plin" | "sassolino" | "querce";
export type Character = {
  name: string;
  role: string;
  voiceDirection: string;
  tts: { gender: "male" | "female"; pitch: number; rate: number };
};
export type Hint = { id: string; afterSeconds?: number; withinMeters?: number; line: Line; text: string };
export type Activity = {
  type: "observe" | "repeat" | "choice";
  lines: Line[];
  options?: string[];
  correctOption?: number;
  adultNote?: string;
};
export type Mission = {
  id: string;
  order: number;
  title: string;
  characterId: CharacterId;
  rewardId: string;
  activationRadiusMeters: number;
  safeStopDescription: string;
  intro: Line[];
  activity: Activity;
  conclusion: Line[];
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

type RawLine = { speaker: CharacterId; text: string };
type RawMission = Omit<Mission, "location" | "safeStop" | "leg" | "verifiedOnSite" | "intro" | "activity" | "conclusion" | "hints"> & {
  intro: RawLine[];
  activity: Omit<Activity, "lines"> & { lines: RawLine[] };
  conclusion: RawLine[];
  hints: (RawLine & { id: string; afterSeconds?: number; withinMeters?: number })[];
};
const raw = missionsJson as unknown as {
  characters: Record<CharacterId, Character>;
  prologue: { title: string; lines: RawLine[] };
  missions: RawMission[];
  rewards: Record<string, Reward>;
  finale: { title: string; lines: RawLine[] };
};

export const characters = raw.characters;

const toLine = (id: string, l: RawLine): Line => {
  if (!raw.characters[l.speaker]) throw new Error(`missions.it.json: personaggio sconosciuto "${l.speaker}" in ${id}`);
  return { id, speaker: l.speaker, text: l.text, audioSrc: `/audio/it/${id}.mp3` };
};
const toLines = (prefix: string, ls: RawLine[]) => ls.map((l, i) => toLine(`${prefix}-${i + 1}`, l));

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
    return {
      ...m,
      intro: toLines(`${m.id}-intro`, m.intro),
      activity: { ...m.activity, lines: toLines(`${m.id}-prova`, m.activity.lines) },
      conclusion: toLines(`${m.id}-fine`, m.conclusion),
      hints: m.hints.map((h) => ({ id: h.id, afterSeconds: h.afterSeconds, withinMeters: h.withinMeters, text: h.text, line: toLine(h.id, h) })),
      location: p.coord,
      safeStop: near.point,
      leg,
      verifiedOnSite: p.verified,
    };
  });

export const prologue = { title: raw.prologue.title, lines: toLines("prologo", raw.prologue.lines) };
export const finale = { title: raw.finale.title, lines: toLines("finale", raw.finale.lines) };

/** Tutte le battute, per lo script che genera gli audio. */
export const allLines: Line[] = [
  ...prologue.lines,
  ...missions.flatMap((m) => [...m.intro, ...m.activity.lines, ...m.conclusion, ...m.hints.map((h) => h.line)]),
  ...finale.lines,
];
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
