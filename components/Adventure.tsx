"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { allVerified, finale, missions, prologue, rewards, route, routeLength } from "@/game/content";
import { reducer } from "@/game/engine";
import type { LngLat } from "@/game/geo";
import { evaluateReading, GEO_CONFIG, initialGeoState, type GeoState } from "@/game/geofencing";
import { visibleHints } from "@/game/hints";
import { clearProgress, loadProgress, newProgress, saveProgress, type GameProgress } from "@/game/progress";
import { useGeolocation, useWakeLock } from "@/hooks/useGeolocation";
import { Narration } from "./audio/Narration";

const MapView = dynamic(() => import("./map/MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => <div className="map map-loading">Carico la mappa…</div>,
});

function chime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [660, 880, 1175].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.15);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + i * 0.15 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.15 + 0.5);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.15);
      o.stop(ctx.currentTime + i * 0.15 + 0.55);
    });
    navigator.vibrate?.([120, 60, 120]);
  } catch {}
}

const fmtMeters = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1).replace(".", ",")} km` : `${Math.round(m / 10) * 10} m`);

export function Adventure() {
  const [state, dispatch] = useReducer(reducer, undefined, newProgress);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState<GameProgress | null>(null);

  useEffect(() => {
    loadProgress().then((p) => {
      if (p && p.phase !== "welcome") setSaved(p);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded && state.phase !== "welcome") saveProgress(state);
  }, [state, loaded]);

  const current = missions[state.currentIndex] ?? null;
  const walking = state.phase === "travel" || state.phase === "mission" || state.phase === "prologue";
  const gpsOn = state.locationMode === "gps" && walking;
  const { reading, status } = useGeolocation(gpsOn);
  useWakeLock(walking);

  // Valutazione GPS
  const [geo, setGeo] = useState<GeoState>(initialGeoState);
  const [geoInfo, setGeoInfo] = useState<{ distance?: number; reliable: boolean; arrived: boolean }>({ reliable: false, arrived: false });
  const [lastOnRoute, setLastOnRoute] = useState<LngLat | null>(null);
  const announced = useRef<string | null>(null);

  useEffect(() => {
    setGeo(initialGeoState);
    setGeoInfo({ reliable: false, arrived: false });
  }, [state.currentIndex]);

  useEffect(() => {
    if (!reading || !current || state.phase !== "travel") return;
    const ev = evaluateReading(geo, reading, current.safeStop, current.activationRadiusMeters, route);
    setGeo(ev.state);
    setGeoInfo({ distance: ev.reliable ? ev.distanceToTarget : geoInfo.distance, reliable: ev.reliable, arrived: ev.arrived });
    if (ev.reliable) {
      dispatch({ type: "distance", meters: ev.distanceToTarget, now: Date.now() });
      if (ev.distanceToRoute <= GEO_CONFIG.backOnRouteMeters) setLastOnRoute(ev.rejoinPoint);
    }
    if (ev.arrived && announced.current !== current.id) {
      announced.current = current.id;
      if (state.audioEnabled) chime();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reading]);

  // Indizi (ricalcolati ogni 15 s per quelli a tempo)
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (state.phase !== "travel") return;
    const id = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(id);
  }, [state.phase]);
  const hints = useMemo(() => {
    if (!current || !state.hints) return [];
    return visibleHints(current.hints, state.hints, {
      now: Date.now(),
      distance: geoInfo.reliable ? geoInfo.distance : undefined,
      offRoute: geo.offRoute,
    }).hints;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, state.hints, geoInfo, geo.offRoute, tick]);

  const [sheet, setSheet] = useState<null | "help" | "collection">(null);
  const [paused, setPaused] = useState(false);
  const [recenter, setRecenter] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  useEffect(() => setChoice(null), [state.currentIndex, state.missionStep]);

  if (!loaded) return <main className="screen center">🍄</main>;

  /* ---------- Benvenuto ---------- */
  if (state.phase === "welcome") {
    return (
      <main className="screen center welcome">
        <div className="hero" aria-hidden>🍄🧙‍♀️🌳</div>
        <h1>Sui sentieri degli Gnomi</h1>
        <p className="lead">Una caccia al tesoro nel Parco di Monza per piccoli esploratori dai 3 ai 5 anni.</p>
        {saved && saved.phase !== "finale" ? (
          <>
            <button className="btn btn-big" onClick={() => dispatch({ type: "load", progress: saved })}>
              Riprendi l&apos;avventura
            </button>
            <p className="muted">
              Siete alla tappa {Math.min(saved.currentIndex + 1, 5)} di 5.
            </p>
            <button
              className="btn btn-ghost"
              onClick={async () => {
                await clearProgress();
                setSaved(null);
                dispatch({ type: "goto", phase: "prepare" });
              }}
            >
              Ricomincia da capo
            </button>
          </>
        ) : (
          <button className="btn btn-big" onClick={() => dispatch({ type: "goto", phase: "prepare" })}>
            Inizia l&apos;avventura
          </button>
        )}
      </main>
    );
  }

  /* ---------- Preparazione ---------- */
  if (state.phase === "prepare") {
    return (
      <main className="screen">
        <h2>Prima di partire</h2>
        {!allVerified && (
          <div className="banner banner-warn">
            Percorso in fase di collaudo: le tappe vanno ancora verificate sul posto.
          </div>
        )}
        <ul className="facts">
          <li>🥾 Circa {fmtMeters(routeLength)} a piedi, da Cascina Bastia ai Giardini della Villa Reale.</li>
          <li>⏱ Circa 1 ora – 1 ora e mezza al passo dei bambini, con le soste.</li>
          <li>📱 Il telefono lo tiene un adulto, che guida e decide il percorso.</li>
          <li>🌿 Si resta sempre sui vialetti: niente scorciatoie nei prati.</li>
          <li>🍂 Non si raccolgono foglie, sassi o fiori: i segreti si trovano con gli occhi.</li>
          <li>💧 Al laghetto si resta fuori dalla recinzione.</li>
        </ul>
        <label className="toggle">
          <input type="checkbox" checked={state.audioEnabled} onChange={() => dispatch({ type: "toggleAudio" })} />
          <span>Voce narrante attiva</span>
        </label>
        <p className="muted small">
          La navigazione è indicativa e non sostituisce l&apos;attenzione dell&apos;adulto accompagnatore.
        </p>
        <div className="actions">
          <button className="btn btn-big" onClick={() => dispatch({ type: "goto", phase: "permission" })}>
            Abbiamo capito
          </button>
        </div>
      </main>
    );
  }

  /* ---------- Permessi ---------- */
  if (state.phase === "permission") {
    return (
      <main className="screen">
        <h2>Posizione</h2>
        <p>
          Per indicarvi la prossima tappa e accorgersi se uscite dal percorso, il gioco usa la posizione del telefono.
        </p>
        <ul className="facts">
          <li>Viene usata solo durante l&apos;avventura e solo su questo telefono.</li>
          <li>Non viene salvata né inviata a nessuno.</li>
          <li>Potete disattivarla in qualsiasi momento.</li>
        </ul>
        <div className="actions">
          <button
            className="btn btn-big"
            onClick={() => {
              dispatch({ type: "setLocationMode", mode: "gps" });
              dispatch({ type: "goto", phase: "prologue" });
            }}
          >
            Usa la posizione
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              dispatch({ type: "setLocationMode", mode: "manual" });
              dispatch({ type: "goto", phase: "prologue" });
            }}
          >
            Continua senza posizione
          </button>
        </div>
      </main>
    );
  }

  /* ---------- Prologo a Cascina Bastia ---------- */
  if (state.phase === "prologue") {
    return (
      <main className="screen">
        <div className="character" aria-hidden>🍄</div>
        <p className="eyebrow">Cascina Bastia</p>
        <h2>{prologue.title}</h2>
        <Narration text={prologue.text} audioSrc={prologue.audioSrc} enabled={state.audioEnabled} />
        {state.locationMode === "gps" && <GpsStatus status={status} />}
        <div className="actions">
          <button className="btn btn-big" onClick={() => dispatch({ type: "startJourney", now: Date.now() })}>
            Partiamo!
          </button>
        </div>
      </main>
    );
  }

  /* ---------- Missione ---------- */
  if (state.phase === "mission" && current) {
    const reward = rewards[current.rewardId];
    return (
      <main className="screen">
        <p className="eyebrow">
          Missione {current.order} di {missions.length} · {current.character}
        </p>
        <h2>{current.title}</h2>

        {state.missionStep === "intro" && (
          <>
            <div className="banner banner-safe">🛑 {current.safeStopDescription}</div>
            <Narration text={current.introductionText} audioSrc={current.introductionAudioSrc} enabled={state.audioEnabled} />
            <div className="actions">
              <button className="btn btn-big" onClick={() => dispatch({ type: "missionNext" })}>
                Facciamo la prova
              </button>
              <button className="btn btn-ghost" onClick={() => dispatch({ type: "goto", phase: "travel" })}>
                Torna alla mappa
              </button>
            </div>
          </>
        )}

        {state.missionStep === "activity" && (
          <>
            <Narration text={current.activity.prompt} enabled={state.audioEnabled} />
            {current.activity.type === "choice" && current.activity.options && (
              <div className="choices">
                {current.activity.options.map((o, i) => (
                  <button
                    key={o}
                    className={`btn btn-choice ${choice === i ? (i === current.activity.correctOption ? "ok" : "retry") : ""}`}
                    onClick={() => setChoice(i)}
                  >
                    {o}
                  </button>
                ))}
                {choice !== null && (
                  <p className="feedback">
                    {choice === current.activity.correctOption ? "Sì! È proprio il suono delle ondine!" : "Mmm… ascoltiamo ancora. Proviamo un altro suono?"}
                  </p>
                )}
              </div>
            )}
            {current.activity.adultNote && <p className="adult-note">👤 Per l&apos;adulto: {current.activity.adultNote}</p>}
            <div className="actions">
              <button className="btn btn-big" onClick={() => dispatch({ type: "missionNext" })}>
                Missione completata
              </button>
            </div>
          </>
        )}

        {state.missionStep === "reward" && (
          <>
            <div className="reward" aria-hidden>{reward.emoji}</div>
            <p className="reward-name">{reward.name}</p>
            <Narration text={current.conclusionText} enabled={state.audioEnabled} />
            <div className="actions">
              <button className="btn btn-big" onClick={() => dispatch({ type: "completeMission", now: Date.now() })}>
                {state.currentIndex + 1 < missions.length ? "Verso la prossima tappa" : "Al gran finale!"}
              </button>
            </div>
          </>
        )}
      </main>
    );
  }

  /* ---------- Finale ---------- */
  if (state.phase === "finale") {
    return (
      <main className="screen center finale">
        <div className="collection-row" aria-label="Segreti raccolti">
          {missions.map((m) => (
            <span key={m.id} className="reward-sm">{rewards[m.rewardId].emoji}</span>
          ))}
        </div>
        <h1>{finale.title}</h1>
        <Narration text={finale.text} audioSrc={finale.audioSrc} enabled={state.audioEnabled} />
        <section className="diploma" aria-label="Diploma">
          <p className="eyebrow">Diploma</p>
          <p className="diploma-title">Custode del bosco</p>
          <p className="muted small">Parco di Monza · {new Date().toLocaleDateString("it-IT")}</p>
        </section>
        <div className="actions">
          <button className="btn btn-soft" onClick={() => window.print()}>
            Stampa il diploma
          </button>
          <button
            className="btn btn-ghost"
            onClick={async () => {
              await clearProgress();
              dispatch({ type: "reset" });
            }}
          >
            Ricomincia
          </button>
        </div>
      </main>
    );
  }

  /* ---------- Mappa / cammino ---------- */
  if (!current) return null;
  const latestHint = hints[hints.length - 1];
  const showRejoin = geo.offRoute ? lastOnRoute : null;

  return (
    <main className="travel">
      <header className="travel-head">
        <div>
          <p className="eyebrow">
            Tappa {current.order} di {missions.length}
          </p>
          <h2 className="travel-title">{current.title}</h2>
        </div>
        <div className="head-meta">
          {state.locationMode === "gps" && geoInfo.distance !== undefined && !geo.offRoute && (
            <span className="pill">~{fmtMeters(geoInfo.distance)}</span>
          )}
          {state.locationMode === "gps" && reading && (
            <span className={`pill ${reading.accuracy <= GEO_CONFIG.maxAccuracyMeters ? "pill-ok" : "pill-warn"}`}>
              GPS ±{Math.round(reading.accuracy)} m
            </span>
          )}
          {state.locationMode === "manual" && <span className="pill pill-warn">Senza GPS</span>}
        </div>
      </header>

      <MapView
        current={current}
        completedIds={state.completedMissionIds}
        reading={state.locationMode === "gps" ? reading : null}
        rejoinPoint={showRejoin}
        recenterKey={recenter}
      />

      <section className="travel-panel">
        {!current.verifiedOnSite && <div className="banner banner-warn small">Tappa da verificare sul posto.</div>}
        {state.locationMode === "gps" && <GpsStatus status={status} onManual={() => dispatch({ type: "setLocationMode", mode: "manual" })} />}

        {geo.offRoute ? (
          <div className="banner banner-alert" role="alert">
            <strong>Siete usciti dal percorso.</strong> Tornate indietro fino al punto ↩ sulla mappa, l&apos;ultimo punto
            del vialetto in cui eravate. Non tagliate per i prati.
          </div>
        ) : geoInfo.arrived ? (
          <div className="banner banner-arrive" role="status">
            <strong>Ci siamo!</strong> {current.safeStopDescription}
          </div>
        ) : latestHint ? (
          <div className="hint">
            <Narration key={latestHint.id} text={latestHint.text} audioSrc={latestHint.audioSrc} enabled={state.audioEnabled} />
          </div>
        ) : null}

        <div className="actions">
          {geoInfo.arrived || state.locationMode === "manual" || status !== "active" ? (
            <button className="btn btn-big" onClick={() => dispatch({ type: "confirmArrival" })}>
              Siamo arrivati: apri la missione
            </button>
          ) : (
            <button className="btn btn-soft" onClick={() => dispatch({ type: "confirmArrival" })}>
              Siamo già qui
            </button>
          )}
        </div>

        <nav className="toolbar" aria-label="Strumenti">
          <button className="tool" onClick={() => setSheet("help")}>❓<span>Aiuto</span></button>
          <button className="tool" onClick={() => setSheet("collection")}>🎒<span>Segreti</span></button>
          <button className="tool" onClick={() => setRecenter((n) => n + 1)}>🎯<span>Centra</span></button>
          <button className="tool" onClick={() => dispatch({ type: "toggleAudio" })}>
            {state.audioEnabled ? "🔊" : "🔇"}
            <span>Voce</span>
          </button>
          <button className="tool" onClick={() => setPaused(true)}>⏸<span>Pausa</span></button>
        </nav>
      </section>

      {sheet === "help" && (
        <Sheet title="Dove devo andare?" onClose={() => setSheet(null)}>
          <p>
            <strong>Prossima tappa:</strong> {current.title}. Seguite la linea gialla fino alla ✕.
          </p>
          <ul className="facts">
            {hints.map((h) => (
              <li key={h.id}>{h.text}</li>
            ))}
          </ul>
          <p className="small">
            <strong>Se vi siete persi:</strong> tornate all&apos;ultimo vialetto che riconoscete e seguite la linea gialla.
            Non tagliate per i prati.
          </p>
          <div className="actions">
            <button className="btn btn-soft" onClick={() => dispatch({ type: "revealHint" })}>
              Nuovo indizio
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setRecenter((n) => n + 1);
                setSheet(null);
              }}
            >
              Ricentra la mappa
            </button>
          </div>
        </Sheet>
      )}

      {sheet === "collection" && (
        <Sheet title="I segreti del bosco" onClose={() => setSheet(null)}>
          <div className="collection">
            {missions.map((m) => {
              const got = state.completedMissionIds.includes(m.id);
              return (
                <div key={m.id} className={`slot ${got ? "got" : ""}`}>
                  <span className="slot-emoji">{got ? rewards[m.rewardId].emoji : "❔"}</span>
                  <span className="small">{got ? rewards[m.rewardId].name : `Tappa ${m.order}`}</span>
                </div>
              );
            })}
          </div>
        </Sheet>
      )}

      {paused && (
        <div className="overlay">
          <div className="pause-card">
            <div className="character" aria-hidden>😴</div>
            <h2>Avventura in pausa</h2>
            <p>Riposatevi pure: il gioco ricorda dove eravate, anche se chiudete il telefono.</p>
            <button
              className="btn btn-big"
              onClick={() => {
                setPaused(false);
                dispatch({ type: "resume", now: Date.now() });
              }}
            >
              Riprendiamo
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function GpsStatus({ status, onManual }: { status: string; onManual?: () => void }) {
  if (status === "active" || status === "off") return null;
  const msg: Record<string, string> = {
    requesting: "Sto cercando la posizione… Se il telefono lo chiede, scegliete «Consenti».",
    denied: "La posizione non è autorizzata. Potete attivarla dalle impostazioni del browser, oppure proseguire senza.",
    unavailable: "Il segnale GPS è debole. Seguite la linea gialla e confermate voi l'arrivo.",
    unsupported: "Questo telefono non fornisce la posizione. Proseguite seguendo la mappa.",
  };
  return (
    <div className="banner banner-warn small">
      {msg[status]}
      {onManual && status !== "requesting" && (
        <button className="link" onClick={onManual}>
          Continua senza GPS
        </button>
      )}
    </div>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h3>{title}</h3>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Chiudi">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
