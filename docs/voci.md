# Voci dei personaggi

Ogni battuta ha un id (es. `m1-intro-2`) ed è un file `public/audio/it/<id>.mp3`. Se il file c'è, l'app lo usa e la bocca del personaggio segue il volume reale della voce. Se manca, legge la voce sintetica del telefono (etichetta «voce provvisoria»).

Elenco completo delle battute: `npm run audio -- --list` (54 battute).

## Strada A — voci generate con ElevenLabs

1. Su elevenlabs.io scegliete una voce per personaggio dalla Voice Library (filtro: italiano), oppure create la vostra: **Voices → Add voice → Instant Voice Clone**, caricando 1–2 minuti di parlato pulito. La regia di ogni voce è in `content/missions.it.json` → `characters.*.voiceDirection`.
2. Incollate i `voiceId` in `content/voices.json`.
3. Generate gli audio:
   - **da GitHub**: Settings → Secrets and variables → Actions → nuovo secret `ELEVENLABS_API_KEY`; poi Actions → «Genera voci dei personaggi» → Run workflow. Gli mp3 vengono salvati nel repo e Vercel ripubblica da solo.
   - **dal computer**: `ELEVENLABS_API_KEY=... npm run audio`
   Lo script rigenera solo le battute nuove o modificate (`--force` per rifarle tutte).

Clonare una voce richiede il consenso della persona a cui appartiene.

## Strada B — battute recitate da voi

Registrate ogni battuta e salvatela con il suo id, es. `public/audio/it/prologo-1.mp3`. Potete passare le registrazioni nel Voice Changer di ElevenLabs per dare a ogni personaggio un timbro diverso mantenendo la vostra interpretazione.

Consigli: stanza silenziosa e senza eco, telefono a circa 20 cm, tono da storia raccontata a un bambino, mezzo secondo di silenzio prima e dopo.
