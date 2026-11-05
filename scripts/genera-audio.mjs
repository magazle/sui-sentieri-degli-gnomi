// Genera le voci dei personaggi con ElevenLabs.
//   ELEVENLABS_API_KEY=... npm run audio            (solo battute nuove o cambiate)
//   ELEVENLABS_API_KEY=... npm run audio -- --force (rigenera tutto)
//   npm run audio -- --list                         (elenca le battute, senza chiamate)
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { listLines } from "./lines.mjs";

const story = JSON.parse(readFileSync("content/missions.it.json", "utf8"));
const cfg = JSON.parse(readFileSync("content/voices.json", "utf8"));
const OUT = "public/audio/it";
const MANIFEST = `${OUT}/manifest.json`;
const force = process.argv.includes("--force");
const listOnly = process.argv.includes("--list");

const lines = listLines(story);
if (listOnly) {
  for (const l of lines) console.log(`${l.id.padEnd(14)} ${l.speaker.padEnd(10)} ${l.text}`);
  console.log(`\n${lines.length} battute`);
  process.exit(0);
}

const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  console.error("Manca ELEVENLABS_API_KEY.");
  process.exit(1);
}
const missingVoices = [...new Set(lines.map((l) => l.speaker))].filter((s) => !cfg.voices[s]?.voiceId);
if (missingVoices.length) {
  console.error(`Manca il voiceId per: ${missingVoices.join(", ")} (content/voices.json).`);
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};
let made = 0;

for (const l of lines) {
  const v = cfg.voices[l.speaker];
  const hash = createHash("sha1").update(JSON.stringify([l.text, v, cfg.model])).digest("hex").slice(0, 12);
  const file = `${OUT}/${l.id}.mp3`;
  if (!force && manifest[l.id] === hash && existsSync(file)) continue;

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${v.voiceId}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "content-type": "application/json", accept: "audio/mpeg" },
    body: JSON.stringify({
      text: l.text,
      model_id: cfg.model,
      language_code: "it",
      voice_settings: { stability: v.stability, similarity_boost: v.similarity, style: v.style, use_speaker_boost: true },
    }),
  });
  if (!res.ok) {
    console.error(`✗ ${l.id}: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  manifest[l.id] = hash;
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  made++;
  console.log(`✓ ${l.id} (${l.speaker})`);
}
console.log(made ? `\n${made} audio generati in ${OUT}` : "Tutti gli audio sono già aggiornati.");
