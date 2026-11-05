"use client";

import { useEffect, useRef, useState } from "react";
import { characters, type Line } from "@/game/content";
import { CharacterArt } from "../characters/CharacterArt";
import { speak, stopAll } from "./voice";

type Props = {
  lines: Line[];
  /** voce attiva: se falsa, si legge il fumetto e si avanza a mano */
  voice: boolean;
  autoPlay?: boolean;
  size?: "big" | "small";
  onFinished?: () => void;
};

/**
 * Scena parlata: il personaggio di turno compare illustrato e "parla" la sua
 * battuta, una dopo l'altra. Il testo è sempre visibile nel fumetto.
 */
export function Dialogue({ lines, voice, autoPlay = true, size = "big", onFinished }: Props) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [synthetic, setSynthetic] = useState(false);
  const level = useRef(0);
  const stopRef = useRef<(() => void) | null>(null);
  const runId = useRef(0);
  const key = lines.map((l) => l.id).join("|");

  const stop = () => {
    runId.current++;
    stopRef.current?.();
    stopRef.current = null;
    stopAll();
    setPlaying(false);
  };

  const playFrom = async (start: number) => {
    stop();
    const id = ++runId.current;
    setPlaying(true);
    for (let i = start; i < lines.length; i++) {
      if (runId.current !== id) return;
      setIndex(i);
      const p = speak(lines[i], level);
      stopRef.current = p.stop;
      const how = await p.done;
      if (runId.current !== id) return;
      setSynthetic(how === "tts");
      // breve respiro tra una battuta e l'altra
      await new Promise((r) => setTimeout(r, 450));
    }
    if (runId.current === id) {
      setPlaying(false);
      onFinished?.();
    }
  };

  useEffect(() => {
    setIndex(0);
    if (voice && autoPlay) playFrom(0);
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, voice]);

  const line = lines[Math.min(index, lines.length - 1)];
  if (!line) return null;
  const ch = characters[line.speaker];
  const last = index >= lines.length - 1;

  return (
    <div className={`dialogue dialogue-${size}`}>
      <div className="dialogue-stage">
        <CharacterArt key={line.speaker} id={line.speaker} levelRef={level} talking={playing} size={size === "big" ? 190 : 96} />
      </div>
      <div className="bubble" aria-live="polite">
        <p className="bubble-name">{ch.name}</p>
        <p className="bubble-text">{line.text}</p>
        <div className="bubble-controls">
          {lines.length > 1 && (
            <span className="dots" aria-label={`Battuta ${index + 1} di ${lines.length}`}>
              {lines.map((l, i) => (
                <i key={l.id} className={i === index ? "on" : i < index ? "seen" : ""} />
              ))}
            </span>
          )}
          {voice ? (
            <>
              <button className="btn btn-soft btn-sm" onClick={() => (playing ? stop() : playFrom(last && !playing ? 0 : index))}>
                {playing ? "⏸ Pausa" : last ? "↺ Riascolta" : "▶ Ascolta"}
              </button>
              {!last && (
                <button className="btn btn-ghost btn-sm" onClick={() => playFrom(index + 1)} aria-label="Battuta successiva">
                  Avanti ⏭
                </button>
              )}
            </>
          ) : (
            !last && (
              <button className="btn btn-soft btn-sm" onClick={() => setIndex(index + 1)}>
                Avanti ⏭
              </button>
            )
          )}
        </div>
        {voice && synthetic && <span className="tag">voce provvisoria</span>}
      </div>
    </div>
  );
}
