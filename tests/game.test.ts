import { describe, expect, it } from "vitest";
import { clampCrop, joinNames, MAX_ZOOM, placePhoto } from "@/components/diploma/diplomaData";
import { allLines, missions, route, routeLength, startPoint } from "@/game/content";
import { guide } from "@/game/guide";
import { listLines } from "@/scripts/lines.mjs";
import story from "@/content/missions.it.json";
import { distanceMeters, nearestOnLine, type LngLat } from "@/game/geo";
import { evaluateReading, GEO_CONFIG, initialGeoState } from "@/game/geofencing";
import { newHintTracker, revealNext, trackDistance, visibleHints } from "@/game/hints";
import { reducer } from "@/game/engine";
import { newProgress } from "@/game/progress";

const offset = (p: LngLat, eastM: number, northM: number): LngLat => [
  p[0] + eastM / (111320 * Math.cos((p[1] * Math.PI) / 180)),
  p[1] + northM / 110540,
];

describe("contenuti e percorso", () => {
  it("ha cinque tappe in ordine lungo il percorso", () => {
    expect(missions.map((m) => m.id)).toEqual(["m1", "m2", "m3", "m4", "m5"]);
    for (let i = 1; i < missions.length; i++) {
      expect(missions[i].leg.endAlong).toBeGreaterThan(missions[i - 1].leg.endAlong);
    }
  });
  it("parte da Cascina Bastia ed è lungo circa 1,65 km", () => {
    expect(distanceMeters(startPoint, route[0])).toBeLessThan(30);
    expect(routeLength).toBeGreaterThan(1550);
    expect(routeLength).toBeLessThan(1750);
  });
  it("ogni punto di sosta è sul sentiero", () => {
    for (const m of missions) expect(nearestOnLine(m.safeStop, route).distance).toBeLessThan(1);
  });
  it("ogni tappa ha almeno tre indizi", () => {
    for (const m of missions) expect(m.hints.length).toBeGreaterThanOrEqual(3);
  });
});

describe("geofencing", () => {
  const m = missions[0];
  const at = (p: LngLat, accuracy = 10, timestamp = 0) => ({ position: p, accuracy, timestamp });

  it("conferma l'arrivo solo dopo letture attendibili consecutive", () => {
    let s = initialGeoState;
    const edge = offset(m.safeStop, 0, 25);
    const r1 = evaluateReading(s, at(edge, 20), m.safeStop, m.activationRadiusMeters, route);
    expect(r1.arrived).toBe(false);
    s = r1.state;
    const r2 = evaluateReading(s, at(edge, 20), m.safeStop, m.activationRadiusMeters, route);
    expect(r2.arrived).toBe(true);
  });

  it("una sola lettura precisa ben dentro il raggio basta", () => {
    expect(evaluateReading(initialGeoState, at(m.safeStop, 8), m.safeStop, 35, route).arrived).toBe(true);
  });

  it("ignora le letture imprecise", () => {
    let s = initialGeoState;
    for (let i = 0; i < 5; i++) s = evaluateReading(s, at(m.safeStop, 80), m.safeStop, 35, route).state;
    expect(s.arrivalStreak).toBe(0);
  });

  it("segnala la deviazione dopo più letture lontane dal sentiero, non per una sola", () => {
    const far = offset(startPoint, -200, 0);
    let s = initialGeoState;
    s = evaluateReading(s, at(far), m.safeStop, 35, route).state;
    expect(s.offRoute).toBe(false);
    for (let i = 1; i < GEO_CONFIG.offRouteReadings; i++) s = evaluateReading(s, at(far), m.safeStop, 35, route).state;
    expect(s.offRoute).toBe(true);
    const back = evaluateReading(s, at(startPoint), m.safeStop, 35, route);
    expect(back.state.offRoute).toBe(false);
  });

  it("il punto di rientro è sul sentiero, non in linea d'aria verso la tappa", () => {
    const far = offset(startPoint, -200, 0);
    const r = evaluateReading(initialGeoState, at(far), m.safeStop, 35, route);
    expect(nearestOnLine(r.rejoinPoint, route).distance).toBeLessThan(1);
  });
});

describe("indizi", () => {
  const hints = missions[0].hints;
  it("mostra la base subito e gli indizi a tempo dopo 3 e 6 minuti senza progressi", () => {
    const t = newHintTracker(0);
    expect(visibleHints(hints, t, { now: 0, offRoute: false }).hints.map((h) => h.id)).toEqual(["m1-h1"]);
    expect(visibleHints(hints, t, { now: 181_000, offRoute: false }).hints.map((h) => h.id)).toEqual(["m1-h1", "m1-h2"]);
    expect(visibleHints(hints, t, { now: 361_000, offRoute: false }).hints).toHaveLength(3);
  });
  it("l'avvicinamento azzera il conteggio del tempo", () => {
    let t = newHintTracker(0);
    t = trackDistance(t, 400, 0);
    t = trackDistance(t, 300, 170_000);
    expect(visibleHints(hints, t, { now: 200_000, offRoute: false }).hints).toHaveLength(1);
  });
  it("aggiunge l'indizio di prossimità entro 80 m e lo nasconde fuori rotta", () => {
    const t = newHintTracker(0);
    expect(visibleHints(hints, t, { now: 0, distance: 60, offRoute: false }).hints.map((h) => h.id)).toContain("m1-h4");
    expect(visibleHints(hints, t, { now: 400_000, distance: 60, offRoute: true }).hints.map((h) => h.id)).toEqual(["m1-h1"]);
  });
  it("«Nuovo indizio» rivela un indizio alla volta", () => {
    let t = newHintTracker(0);
    t = revealNext(hints, t);
    expect(t.revealed).toEqual(["m1-h2"]);
    t = revealNext(hints, t);
    expect(t.revealed).toEqual(["m1-h2", "m1-h3"]);
  });
});

describe("motore di gioco", () => {
  it("completa le cinque missioni e arriva al finale", () => {
    let s = reducer(newProgress(), { type: "startJourney", now: 0 });
    for (let i = 0; i < 5; i++) {
      s = reducer(s, { type: "confirmArrival" });
      expect(s.phase).toBe("mission");
      s = reducer(s, { type: "missionNext" });
      s = reducer(s, { type: "missionNext" });
      s = reducer(s, { type: "completeMission", now: i });
    }
    expect(s.phase).toBe("finale");
    expect(s.completedMissionIds).toHaveLength(5);
  });
});

describe("dialoghi e audio", () => {
  it("lo script audio e l'app usano gli stessi id di battuta", () => {
    expect(listLines(story).map((l: { id: string }) => l.id)).toEqual(allLines.map((l) => l.id));
  });
  it("gli id delle battute sono unici", () => {
    expect(new Set(allLines.map((l) => l.id)).size).toBe(allLines.length);
  });
});

describe("guida verso la tappa", () => {
  const m = missions[1];
  it("sul vialetto punta lungo il percorso e conta i metri rimanenti", () => {
    const g = guide(m.safeStop, missions[1], route);
    expect(g.toTrail).toBe(0);
    expect(g.alongTrail).toBeLessThan(5);
  });
  it("fuori dal vialetto porta prima al punto più vicino del tratto in corso", () => {
    const off = offset(startPoint, 0, -60);
    const g = guide(off, m, route);
    expect(g.toTrail).toBeGreaterThan(20);
    expect(nearestOnLine(g.trailPoint, route).distance).toBeLessThan(1);
  });
  it("riconosce chi è lontano dal parco", () => {
    expect(guide([4.35, 50.85], m, route).farAway).toBe(true);
  });
});

describe("foto del diploma", () => {
  const size = { w: 1200, h: 900 };
  const circle = { cx: 500, cy: 560, r: 205 };
  it("la foto copre sempre tutto il cerchio", () => {
    for (const crop of [{ zoom: 1, dx: 999, dy: -999 }, { zoom: 0.2, dx: 0, dy: 0 }, { zoom: 3, dx: -400, dy: 400 }]) {
      const c = clampCrop(size, crop, circle.r);
      const p = placePhoto(size, c, circle);
      expect(p.x).toBeLessThanOrEqual(circle.cx - circle.r + 1e-6);
      expect(p.y).toBeLessThanOrEqual(circle.cy - circle.r + 1e-6);
      expect(p.x + p.w).toBeGreaterThanOrEqual(circle.cx + circle.r - 1e-6);
      expect(p.y + p.h).toBeGreaterThanOrEqual(circle.cy + circle.r - 1e-6);
    }
  });
  it("lo zoom resta tra 1 e il massimo", () => {
    expect(clampCrop(size, { zoom: 0.5, dx: 0, dy: 0 }, 205).zoom).toBe(1);
    expect(clampCrop(size, { zoom: 99, dx: 0, dy: 0 }, 205).zoom).toBe(MAX_ZOOM);
  });
  it("i nomi si uniscono con virgole e una sola «e»", () => {
    expect(joinNames(["Anna", " ", "Leo", "Sofia"])).toBe("Anna, Leo e Sofia");
  });
});
