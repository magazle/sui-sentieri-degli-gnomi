import { missions } from "./content";
import { newHintTracker, revealNext, trackDistance } from "./hints";
import { newProgress, type GameProgress, type Phase } from "./progress";

export type Action =
  | { type: "load"; progress: GameProgress }
  | { type: "goto"; phase: Phase }
  | { type: "setLocationMode"; mode: "gps" | "manual" }
  | { type: "toggleAudio" }
  | { type: "startJourney"; now: number }
  /** L'adulto conferma l'arrivo (dopo il suggerimento GPS o in modalità manuale). */
  | { type: "confirmArrival" }
  | { type: "missionNext" }
  /** Chiude la missione e apre la tappa successiva (o il finale). */
  | { type: "completeMission"; now: number }
  | { type: "distance"; meters: number; now: number }
  | { type: "revealHint" }
  /** Pausa per bambino stanco: si torna alla mappa, il tracker riparte alla ripresa. */
  | { type: "resume"; now: number }
  | { type: "reset" };

export function reducer(s: GameProgress, a: Action): GameProgress {
  switch (a.type) {
    case "load":
      return a.progress;
    case "goto":
      return { ...s, phase: a.phase };
    case "setLocationMode":
      return { ...s, locationMode: a.mode };
    case "toggleAudio":
      return { ...s, audioEnabled: !s.audioEnabled };
    case "startJourney":
      return { ...s, phase: "travel", currentIndex: 0, missionStep: "intro", hints: newHintTracker(a.now) };
    case "confirmArrival":
      if (s.phase !== "travel" || s.currentIndex >= missions.length) return s;
      return { ...s, phase: "mission", missionStep: "intro" };
    case "missionNext":
      return { ...s, missionStep: s.missionStep === "intro" ? "activity" : "reward" };
    case "completeMission": {
      const m = missions[s.currentIndex];
      if (!m) return s;
      const completed = s.completedMissionIds.includes(m.id) ? s.completedMissionIds : [...s.completedMissionIds, m.id];
      const next = s.currentIndex + 1;
      if (next >= missions.length) return { ...s, completedMissionIds: completed, currentIndex: next, phase: "finale", hints: null };
      return {
        ...s,
        completedMissionIds: completed,
        currentIndex: next,
        phase: "travel",
        missionStep: "intro",
        hints: newHintTracker(a.now),
      };
    }
    case "distance":
      return s.hints ? { ...s, hints: trackDistance(s.hints, a.meters, a.now) } : s;
    case "revealHint": {
      const m = missions[s.currentIndex];
      return m && s.hints ? { ...s, hints: revealNext(m.hints, s.hints) } : s;
    }
    case "resume":
      return s.hints ? { ...s, hints: { ...s.hints, lastProgressAt: a.now } } : s;
    case "reset":
      return { ...newProgress(), audioEnabled: s.audioEnabled };
  }
}
