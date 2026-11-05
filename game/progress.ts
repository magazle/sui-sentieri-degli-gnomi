import { get, set, del } from "idb-keyval";
import type { HintTracker } from "./hints";

export const PROGRESS_VERSION = 1;
const KEY = "gnomi-progress";

export type Phase = "welcome" | "prepare" | "permission" | "prologue" | "travel" | "mission" | "finale";

export type GameProgress = {
  version: number;
  phase: Phase;
  /** indice della tappa in corso (0..4); 5 = completato */
  currentIndex: number;
  completedMissionIds: string[];
  /** passo dentro la missione: intro → attività → premio */
  missionStep: "intro" | "activity" | "reward";
  locationMode: "gps" | "manual";
  audioEnabled: boolean;
  hints: HintTracker | null;
  startedAt: string;
  updatedAt: string;
};

export function newProgress(): GameProgress {
  const now = new Date().toISOString();
  return {
    version: PROGRESS_VERSION,
    phase: "welcome",
    currentIndex: 0,
    completedMissionIds: [],
    missionStep: "intro",
    locationMode: "gps",
    audioEnabled: true,
    hints: null,
    startedAt: now,
    updatedAt: now,
  };
}

/** Salvataggio locale: IndexedDB, con localStorage come ripiego. Nessuna posizione viene salvata. */
export async function loadProgress(): Promise<GameProgress | null> {
  try {
    const p = (await get(KEY)) as GameProgress | undefined;
    if (p?.version === PROGRESS_VERSION) return p;
  } catch {
    try {
      const raw = localStorage.getItem(KEY);
      const p = raw ? (JSON.parse(raw) as GameProgress) : null;
      if (p?.version === PROGRESS_VERSION) return p;
    } catch {}
  }
  return null;
}

export async function saveProgress(p: GameProgress): Promise<void> {
  const value = { ...p, updatedAt: new Date().toISOString() };
  try {
    await set(KEY, value);
  } catch {
    try {
      localStorage.setItem(KEY, JSON.stringify(value));
    } catch {}
  }
}

export async function clearProgress(): Promise<void> {
  try {
    await del(KEY);
  } catch {}
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
