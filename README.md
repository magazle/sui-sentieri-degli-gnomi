# Sui sentieri degli Gnomi

Caccia al tesoro narrata nel Parco della Villa Reale di Monza per bambini dai 3 ai 5 anni, da vivere a piedi con lo smartphone in mano a un adulto. Web app mobile-first, installabile come PWA.

Specifica completa: [`docs/specifiche.md`](docs/specifiche.md).

## Il percorso

Circa 1,65 km, partenza da **Cascina Bastia** (la casa di Bastiano, lo gnomo custode).

| # | Tappa | Tema | Ricompensa |
|---|---|---|---|
| — | Cascina Bastia | Prologo | — |
| 1 | Faggio delle Streghe | Streghe | 🍃 Foglia magica |
| 2 | Torretta Viscontea | Poesia | ✨ Parola segreta |
| 3 | Laghetto Giardini Reali | Ondine | 💧 Goccia luminosa |
| 4 | Caverna dei Coboldi | Coboldi | 🪨 Pietra dei coboldi |
| 5 | Due querce | Formula finale | 🌰 Ghianda d'oro + diploma |

Il tracciato viene dalla mappa Google My Maps del progetto (`docs/source/`) ed è in `content/route.geo.json`. **Nessun punto è ancora verificato sul posto** (`verifiedOnSite: false`): l'app lo segnala con un avviso.

## Sviluppo

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # logica di gioco: geofencing, indizi, motore
npm run build
```

Il GPS del browser richiede HTTPS (o `localhost`). Per provare su telefono usate il deploy Vercel, oppure in Chrome DevTools → Sensors per simulare la posizione.

## Struttura

```text
content/   missions.it.json (testi, indizi, attività) · route.geo.json (tracciato e tappe)
game/      geo · geofencing · hints · engine · progress · content
components/ Adventure (schermate) · map/MapView · audio/Narration
public/    sw.js (PWA) · manifest · audio/it/ (file narrati, da produrre)
tests/     test della logica di gioco
```

Contenuti, coordinate, regole e UI sono separati: per cambiare un testo si tocca solo `content/missions.it.json`, per spostare una tappa solo `content/route.geo.json`.

## Guida sulla mappa

- ✕ rossa con il nome: la prossima tappa. Numeri grigi: le tappe successive. Emoji: tappe completate.
- Linea gialla con frecce: il tratto di vialetto ancora da fare.
- Freccia blu sulla vostra posizione: la direzione da seguire. Fuori dal vialetto, la linea blu tratteggiata porta al punto più vicino del vialetto (pallino bianco).
- «Guidami»: attiva la bussola, la mappa ruota come il telefono e inquadra posizione e prossimi metri.
- Se siete lontani dal parco, la mappa mostra solo il percorso.

## Regole di gioco (configurabili)

Soglie in `game/geofencing.ts` e `game/hints.ts`, da calibrare sul campo:

- **Arrivo**: entro 35 m dal punto di sosta, con GPS ≤ 30 m; serve una lettura chiaramente dentro il raggio o due consecutive. L'apertura della missione è sempre confermata dall'adulto.
- **Deviazione**: 3 letture attendibili a oltre 50 m dal sentiero; si rientra sotto i 30 m. L'app indica l'ultimo punto del vialetto in cui eravate, senza tracciare scorciatoie.
- **Indizi**: base subito; dopo 3 e 6 minuti senza avvicinarsi di almeno 20 m; uno di prossimità entro 80 m; fuori rotta solo la base. «Nuovo indizio» ne rivela uno alla volta.

## Stato e cose da fare

- [ ] **Sopralluogo**: verificare tappe, punti di sosta e raggi, poi mettere `verifiedOnSite: true` (vedi `docs/field-survey.md`).
- [ ] **Testi**: le missioni sono bozze editoriali da approvare.
- [ ] **Voci**: mancano gli audio in `public/audio/it/`; finché non ci sono, l'app usa la voce sintetica del telefono con un timbro diverso per personaggio. Come generarle o registrarle: `docs/voci.md`.
- [x] **Personaggi**: Bastiano, Fagiolina, Rimario, Plin, Sassolino e Nonna Quercia, illustrati e animati. Galleria con prova voce su `/personaggi`.
- [ ] **Mappe offline**: vedi `docs/mappe.md`.
- [ ] Privacy notice prima della pubblicazione.
