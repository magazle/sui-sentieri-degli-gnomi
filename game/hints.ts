import type { Hint } from "./content";

/** Di quanti metri bisogna avvicinarsi perché conti come "progresso". */
export const PROGRESS_STEP_METERS = 20;

export type HintTracker = {
  legStartedAt: number;
  lastProgressAt: number;
  bestDistance: number;
  revealed: string[];
};

export function newHintTracker(now: number): HintTracker {
  return { legStartedAt: now, lastProgressAt: now, bestDistance: Infinity, revealed: [] };
}

/** Aggiorna il tracker con una distanza attendibile dalla tappa. */
export function trackDistance(t: HintTracker, distance: number, now: number): HintTracker {
  if (t.bestDistance === Infinity) return { ...t, bestDistance: distance };
  if (distance < t.bestDistance - PROGRESS_STEP_METERS) {
    return { ...t, bestDistance: distance, lastProgressAt: now };
  }
  return t;
}

export type HintContext = {
  now: number;
  /** distanza attendibile dalla tappa, se disponibile */
  distance?: number;
  offRoute: boolean;
};

/** "Nuovo indizio": rivela subito il prossimo indizio a tempo non ancora visto. */
export function revealNext(hints: Hint[], t: HintTracker): HintTracker {
  const next = hints
    .filter((h) => h.afterSeconds !== undefined && !t.revealed.includes(h.id))
    .sort((a, b) => a.afterSeconds! - b.afterSeconds!)[0];
  return next ? { ...t, revealed: [...t.revealed, next.id] } : t;
}

/**
 * Restituisce gli indizi da mostrare, dal più generico al più specifico.
 * Regole riproducibili: base sempre; a tempo dopo N secondi senza progressi;
 * di prossimità entro N metri con GPS attendibile; fuori rotta solo la base.
 */
export function visibleHints(hints: Hint[], t: HintTracker, ctx: HintContext): { hints: Hint[]; tracker: HintTracker } {
  const idle = (ctx.now - t.lastProgressAt) / 1000;
  const revealed = new Set(t.revealed);

  const timed = hints.filter((h) => h.afterSeconds !== undefined).sort((a, b) => a.afterSeconds! - b.afterSeconds!);
  for (const h of timed) if (idle >= h.afterSeconds!) revealed.add(h.id);

  const base = hints.filter((h) => h.afterSeconds === undefined && h.withinMeters === undefined);
  if (ctx.offRoute) return { hints: base, tracker: { ...t, revealed: [...revealed] } };

  const proximity = hints.filter(
    (h) => h.withinMeters !== undefined && ctx.distance !== undefined && ctx.distance <= h.withinMeters,
  );
  const shown = [...base, ...timed.filter((h) => revealed.has(h.id)), ...proximity];
  return { hints: shown, tracker: { ...t, revealed: [...revealed] } };
}
