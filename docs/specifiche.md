# Sui sentieri degli Gnomi

> Specifica funzionale e tecnica per lo sviluppo della web app — versione 0.1, 5 novembre 2026.

## 1. Visione e contesto

Esperienza narrativa interattiva per famiglie con bambini di **3–5 anni**, da vivere a piedi nel **Parco della Villa Reale di Monza**. Il progetto prende spunto dall'itinerario dedicato a gnomi e streghe, trasformandolo in una caccia al tesoro con **cinque missioni**, narrazione audiovisiva e navigazione geolocalizzata.

**Nome:** Sui sentieri degli Gnomi  
**Pubblico:** bambini 3–5 anni accompagnati da almeno un adulto  
**Dispositivo:** smartphone dell'accompagnatore  
**Formato:** web app mobile-first, installabile come PWA  
**Percorso ipotizzato in precedenza:** circa 2 km, **da verificare sul tracciato reale**.  
**Riferimento geografico condiviso:** https://goo.gl/maps/E8Uxy7xmaDPUqXcU9  
**Fonte di ispirazione:** https://www.monzatoday.it/social/gnomi_streghe_villa-reale-monza.html

### Obiettivi

- Guidare la famiglia lungo un itinerario reale, sicuro e verificato.
- Rendere ogni tappa un episodio della stessa storia.
- Consentire ai bambini di partecipare senza saper leggere.
- Fornire indicazioni chiare all'adulto, indizi progressivi e recupero in caso di deviazione.
- Ridurre la necessità di guardare continuamente lo schermo.

## 2. Ambito del prodotto

### MVP obbligatorio

1. Schermata introduttiva, istruzioni e consenso all'uso della posizione.
2. Mappa con posizione dell'utente, **X sulla prossima destinazione**, sentieri e tracciato consigliato.
3. Cinque missioni sequenziali con introduzione narrata, indizio, attività e conclusione.
4. Sblocco delle tappe tramite prossimità GPS, con conferma manuale dell'adulto.
5. Indizi aggiuntivi dopo un intervallo di tempo o in base alla distanza dalla tappa.
6. Avviso di deviazione e percorso guidato per rientrare sul sentiero.
7. Audio riproducibile, in pausa e riascoltabile; testi equivalenti sempre disponibili.
8. Persistenza del progresso anche dopo la chiusura del browser.
9. Interfaccia accessibile, con pulsanti grandi e uso prevalente da parte dell'adulto.
10. Finale celebrativo dopo il completamento delle cinque missioni.

### Evoluzioni successive

- Illustrazioni animate e personaggi ricorrenti.
- Download anticipato di mappe e audio per uso offline completo.
- Percorsi alternativi, durata adattiva, lingue aggiuntive.
- Modalità accessibilità avanzata e stampa di un attestato.
- Telemetria anonima e diagnostica, soltanto se necessarie e configurate nel rispetto della privacy.

## 3. Trama e struttura narrativa

**Premessa editoriale proposta:** il bosco ha perso cinque piccoli segreti magici. Una voce guida chiede alla famiglia di recuperarli incontrando creature del parco. Ogni missione restituisce un simbolo; completate tutte, i bambini pronunciano una formula finale.

Le cinque ambientazioni qui sotto riprendono la struttura discussa in precedenza. **La posizione esatta e l'effettiva esistenza/accessibilità di ciascun punto devono essere verificate sul posto.** I nomi narrativi, le prove e i dialoghi sono bozze editoriali da validare, non testi già approvati.

| # | Tappa proposta | Tema | Attività per bambini | Ricompensa narrativa |
|---|---|---|---|---|
| 1 | Faggio nei pressi di Cascina Cavriga | Streghe | Individuare un albero speciale e imitare il fruscio delle foglie | Foglia magica |
| 2 | Laghetto | Ondine | Ascoltare l'acqua e scegliere quale suono appartiene alle ondine | Goccia luminosa |
| 3 | Torretta / Tempietto | Poesia | Ripetere una breve filastrocca con l'adulto | Parola segreta |
| 4 | Area dei coboldi, tre pietre | Coboldi | Cercare visivamente tre pietre senza spostarle o uscire dal sentiero | Pietra simbolica |
| 5 | Due querce | Formula finale | Ripetere la formula con i simboli raccolti | Diploma di custode del bosco |

**Regola fondamentale:** le attività non devono richiedere di raccogliere materiali naturali, toccare animali, avvicinarsi all'acqua o abbandonare i percorsi consentiti.

### Schema di ogni missione

1. **Arrivo:** breve segnale sonoro e invito dell'adulto a fermarsi in un punto sicuro.
2. **Introduzione audio:** 20–45 secondi, con sottotitoli/testo.
3. **Osservazione:** un indizio legato a un elemento realmente riconoscibile.
4. **Azione:** microgioco fisico o domanda con 1–3 scelte, senza lettura autonoma.
5. **Conferma:** adulto seleziona «Missione completata».
6. **Premio:** simbolo illustrato aggiunto alla collezione.
7. **Transizione:** nuovo indizio e apertura della tappa successiva sulla mappa.

### Esempio di testo narrativo (provvisorio)

> «Psst! Piccoli esploratori, sentite anche voi? Il bosco ci sta chiamando. Da qualche parte, vicino a un grande albero, una strega gentile ha nascosto il primo segreto. Camminiamo insieme e teniamo gli occhi aperti!»

## 4. Esperienza utente

### Flusso principale

`Benvenuto → Come funziona → Consenso GPS → Controllo posizione → Mappa / Tappa 1 → Arrivo → Missione 1 → … → Missione 5 → Finale`

### Schermate

| Schermata | Elementi principali |
|---|---|
| Benvenuto | Titolo, illustrazione, pulsante «Inizia l'avventura» |
| Preparazione | Durata/distanza verificate, raccomandazioni, audio on/off, avviso di supervisione |
| Permessi | Spiegazione dell'uso della geolocalizzazione, richiesta autorizzazione, alternativa manuale |
| Mappa | Punto GPS, accuratezza, X destinazione, percorso, distanza indicativa, indizio, pulsante audio |
| Missione | Personaggio, audio, testo, attività, risposta/conferma |
| Collezione | Cinque simboli con stato ottenuto/mancante |
| Aiuto | «Dove devo andare?», nuovo indizio, recentra mappa, istruzioni di rientro |
| Finale | Congratulazioni, riepilogo, attestato facoltativo, ricomincia |

### Stati da gestire

- GPS negato, indisponibile o con precisione insufficiente.
- Connessione assente o intermittente.
- Audio bloccato dal browser finché l'utente non interagisce.
- Arrivo in prossimità della tappa ma fuori dal percorso.
- Utente che salta una tappa, torna indietro o chiude la pagina.
- Parco o sentiero temporaneamente non accessibile.
- Bambino stanco: pausa e ripresa successiva.

## 5. Geolocalizzazione e navigazione

### Dati geografici necessari

Per ogni tappa registrare:

- `id`, `name`, `latitude`, `longitude` (WGS84).
- Punto sicuro in cui sostare e completare l'attività.
- Raggio di attivazione e accuratezza GPS richiesta.
- Foto di riferimento e descrizione dell'elemento da cercare.
- Eventuali rischi e restrizioni.
- Collegamento al segmento pedonale consentito.

Per il percorso registrare un **GeoJSON LineString** con geometria reale e verificata, non una linea retta tra tappe. Se possibile acquisire anche una rete di sentieri percorribili per il ricalcolo.

### Logica proposta

- Aggiornamento GPS tramite `navigator.geolocation.watchPosition`, solo durante l'esperienza e con consenso.
- Indicazione di accuratezza; ignorare letture palesemente imprecise per lo sblocco automatico.
- **Raggio iniziale suggerito:** 25–40 m dalla tappa, da calibrare in loco secondo copertura e visibilità.
- L'arrivo suggerisce l'apertura della missione; la conferma definitiva è sempre dell'adulto.
- Calcolare la distanza dal percorso più vicino, evitando falsi allarmi dovuti a jitter GPS.
- **Deviazione proposta:** avvisare dopo più letture attendibili a oltre 40–60 m dal sentiero; soglie da testare sul posto.
- Quando fuori rotta, mostrare il punto sicuro di rientro e le indicazioni pedonali, senza proporre attraversamenti non verificati.
- Se il routing non è disponibile, mostrare istruzioni conservative: tornare all'ultimo punto noto del sentiero; non tracciare scorciatoie in linea d'aria.

### Indizi dinamici

Il sistema di indizi deve considerare **sia il tempo trascorso sia la distanza**, senza sostituire la navigazione dell'adulto:

| Condizione proposta | Comportamento |
|---|---|
| Partenza per nuova tappa | Indizio narrativo generico |
| Dopo 3 minuti senza progressi | Indizio visivo più specifico |
| Dopo 6 minuti senza progressi | Mostrare riferimento riconoscibile e possibilità di ascoltare una guida |
| Entro ~80 m dalla tappa | Indizio contestuale, solo se GPS attendibile |
| Fuori rotta | Interrompere gli indizi di ricerca e privilegiare il rientro sul percorso |

Le soglie sono **parametri configurabili da validare**, non decisioni definitive.

## 6. Architettura tecnica

Stack proposto nella conversazione precedente:

- **Frontend:** Next.js, React, TypeScript.
- **Stile:** Tailwind CSS; Motion/Rive per eventuali animazioni.
- **Mappe:** MapLibre GL JS con dati OpenStreetMap e provider di tile conforme alle relative condizioni d'uso.
- **Routing:** motore pedonale compatibile con i sentieri verificati; in MVP preferire tracciato predefinito e punti di rientro curati manualmente.
- **Geolocalizzazione:** Web Geolocation API.
- **Audio:** file preregistrati, player HTML5 e trascrizioni.
- **Persistenza:** IndexedDB per avanzamento, contenuti e risorse selezionate; Service Worker per PWA.
- **Hosting:** deployment HTTPS, ad esempio Vercel.

### Organizzazione del repository

```text
sui-sentieri-degli-gnomi/
├── app/
│   ├── page.tsx
│   ├── adventure/page.tsx
│   └── finale/page.tsx
├── components/
│   ├── map/
│   ├── audio/
│   ├── mission/
│   └── ui/
├── game/
│   ├── engine.ts
│   ├── geofencing.ts
│   ├── hints.ts
│   └── progress.ts
├── content/
│   ├── missions.it.json
│   └── route.geojson
├── public/
│   ├── audio/it/
│   ├── images/
│   └── icons/
├── docs/
│   ├── field-survey.md
│   └── content-guide.md
└── tests/
```

### Modello dati suggerito

```ts
type Coordinates = { lat: number; lng: number };
type Hint = {
  id: string;
  text: string;
  audioSrc?: string;
  afterSeconds?: number;
  withinMeters?: number;
};
type Mission = {
  id: string;
  order: number;
  title: string;
  location: Coordinates | null; // null finché non verificata
  activationRadiusMeters: number;
  safeStopDescription: string;
  introductionText: string;
  introductionAudioSrc: string;
  activity: { prompt: string; type: 'observe' | 'repeat' | 'choice'; options?: string[] };
  hints: Hint[];
  rewardId: string;
  verifiedOnSite: boolean;
};
type GameProgress = {
  version: number;
  currentMissionId: string;
  completedMissionIds: string[];
  startedAt: string;
  updatedAt: string;
  audioEnabled: boolean;
};
```

Separare **contenuti editoriali**, **coordinate**, **regole di gioco** e **componenti UI**. Le coordinate non verificate non devono mai essere presentate come destinazioni navigabili.

## 7. Accessibilità, sicurezza e privacy

- Il gioco è destinato a minori accompagnati: i comandi e le decisioni di navigazione spettano all'adulto.
- Nessun account obbligatorio; nessun dato personale del bambino necessario per l'MVP.
- Elaborare la posizione sul dispositivo ove possibile; evitare di conservarne la cronologia o inviarla a servizi esterni non indispensabili.
- Richiedere la geolocalizzazione solo dopo una spiegazione chiara; consentire di interromperla.
- HTTPS obbligatorio; prevedere privacy notice e verifica dei fornitori di mappe/hosting.
- Testo equivalente per ogni audio, contrasto leggibile, controlli grandi, supporto screen reader e riduzione animazioni.
- Vietare esplicitamente la ricerca fuori sentiero, la raccolta di elementi naturali e l'avvicinamento a specchi d'acqua.
- Prima della pubblicazione verificare regolamento del Parco, orari/accessi, percorribilità, eventuali lavori e restrizioni.
- La navigazione GPS è indicativa e non sostituisce l'attenzione dell'accompagnatore.

## 8. Materiali da produrre

| Asset | Quantità iniziale | Specifica |
|---|---:|---|
| Script introduzione | 1 | 30–60 s, linguaggio 3–5 anni |
| Script missioni | 5 | 20–45 s ciascuno |
| Script transizioni/finale | 6 | Brevi, coerenti con la trama |
| Indizi progressivi | 3 per tappa | Testo e, preferibilmente, audio |
| Effetti sonori | 5–10 | Originali o con licenza compatibile |
| Illustrazioni ambienti/personaggi | 5+ | Stile coerente, leggibile su mobile |
| Icone ricompensa | 5 | Una per missione |
| Foto di riconoscimento tappa | 5 | Scattate sul posto |
| Coordinate e punti di sosta | 5 | Verificati con sopralluogo |
| Traccia GeoJSON | 1 | Su sentieri effettivamente consentiti |

## 9. Piano di lavoro e responsabilità

### Fase A — Sopralluogo e verifica (utente / referente locale)

- [ ] Aprire il link Google Maps e identificare le cinque destinazioni reali.
- [ ] Esportare il percorso in KML/GPX oppure rilevarlo sul posto.
- [ ] Registrare coordinate GPS e fotografie per ogni tappa.
- [ ] Verificare distanza, tempi a passo di bambino, accessibilità e punti critici.
- [ ] Confermare l'ordine delle tappe e l'esistenza dei riferimenti narrativi.
- [ ] Verificare permessi, accessi e condizioni dei sentieri.

### Fase B — Produzione editoriale (contenuti)

- [ ] Approvare trama, personaggi e cinque attività.
- [ ] Scrivere script completi di missioni, indizi, transizioni e finale.
- [ ] Registrare e montare audio; produrre trascrizioni.
- [ ] Disegnare illustrazioni, icone e attestato.

### Fase C — Implementazione (sviluppo)

- [ ] Inizializzare Next.js/TypeScript e PWA.
- [ ] Creare sistema dati missioni e validazione dello schema.
- [ ] Integrare MapLibre, percorso e geolocalizzazione.
- [ ] Implementare motore di avanzamento e salvataggio locale.
- [ ] Implementare geofencing, indizi e rilevamento deviazioni.
- [ ] Realizzare player audio e schermate responsive.
- [ ] Gestire errori, permessi negati e connessione instabile.

### Fase D — Collaudo e rilascio

- [ ] Verificare coordinate e raggi di attivazione sul campo.
- [ ] Testare GPS su iOS Safari e Android Chrome.
- [ ] Testare il percorso con almeno una famiglia e bambini della fascia d'età.
- [ ] Verificare durata reale, comprensione degli indizi e sicurezza.
- [ ] Testare ripresa sessione, audio, batteria e rete debole.
- [ ] Pubblicare su HTTPS con informativa privacy e istruzioni.

## 10. Criteri di accettazione MVP

Il progetto è pronto per il primo test pubblico quando:

1. Tutte e cinque le tappe hanno coordinate e punti di sosta verificati.
2. Il percorso visualizzato segue sentieri percorribili e consentiti.
3. La mappa mostra sempre la prossima destinazione e una posizione GPS con indicazione di accuratezza.
4. Ogni missione può essere completata senza che il bambino debba leggere.
5. Gli indizi progressivi si attivano secondo regole riproducibili.
6. Le deviazioni producono istruzioni di recupero sicure, senza scorciatoie arbitrarie.
7. Il progresso sopravvive a ricaricamento e chiusura del browser.
8. Audio e trascrizioni sono disponibili per ogni passaggio essenziale.
9. Il gioco funziona sui browser mobili supportati anche con GPS negato, tramite modalità manuale chiaramente segnalata.
10. Il percorso è stato testato sul posto con esito soddisfacente.

## 11. Questioni ancora aperte

**Bloccanti per una navigazione reale:**

- Coordinate precise delle cinque tappe e traccia completa del percorso.
- Conferma dei nomi e dei punti di riferimento effettivamente visibili.
- Identificazione di soste sicure, passaggi accessibili e aree vietate.

**Decisioni di prodotto:**

- Durata target dell'esperienza e necessità di un percorso abbreviato.
- Stile visivo, voce narrante, musica e tono dei personaggi.
- Lingue da supportare oltre all'italiano.
- Comportamento offline richiesto per il primo rilascio.
- Eventuale condivisione di attestati o risultati.

## 12. Prossimo passo operativo

**Priorità 1: costruire il file geografico verificato.** Raccogliere per ciascuna delle cinque tappe coordinate, fotografia, descrizione del punto sicuro e sequenza dei sentieri. Convertire poi il tracciato in `content/route.geojson` e valorizzare `location` nelle missioni. Soltanto dopo è possibile collaudare geofencing, indizi basati sulla distanza e rientro in rotta.

---

### Nota sullo stato delle informazioni

Questo documento integra i requisiti e le cinque ambientazioni recuperate dalla precedente progettazione con **proposte implementative esplicitamente indicate come tali**. Non costituisce una verifica topografica o normativa del Parco. Dialoghi, soglie GPS, tempi degli indizi e scelte editoriali devono essere approvati e testati prima del rilascio.
