// Elenco delle battute con il loro id: è anche il nome del file audio.
// Deve restare allineato a game/content.ts (c'è un test che lo controlla).
export function listLines(story) {
  const out = [];
  const push = (prefix, lines) => lines.forEach((l, i) => out.push({ id: `${prefix}-${i + 1}`, speaker: l.speaker, text: l.text }));
  push("prologo", story.prologue.lines);
  for (const m of [...story.missions].sort((a, b) => a.order - b.order)) {
    push(`${m.id}-intro`, m.intro);
    push(`${m.id}-prova`, m.activity.lines);
    push(`${m.id}-fine`, m.conclusion);
    for (const h of m.hints) out.push({ id: h.id, speaker: h.speaker, text: h.text });
  }
  push("finale", story.finale.lines);
  return out;
}
