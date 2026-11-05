"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  audioSrc?: string;
  enabled: boolean;
  /** riproduce appena montato (solo dopo un tocco dell'utente, per i limiti dei browser) */
  autoPlay?: boolean;
};

/**
 * Narrazione: file audio preregistrato se presente, altrimenti voce
 * sintetica italiana provvisoria. Il testo equivalente è sempre visibile.
 */
export function Narration({ text, audioSrc, enabled, autoPlay = true }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [usingTts, setUsingTts] = useState(false);

  const stop = () => {
    audioRef.current?.pause();
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    setPlaying(false);
  };

  const speak = () => {
    if (typeof speechSynthesis === "undefined") return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "it-IT";
    u.rate = 0.92;
    u.pitch = 1.1;
    const voice = speechSynthesis.getVoices().find((v) => v.lang.startsWith("it"));
    if (voice) u.voice = voice;
    u.onend = () => setPlaying(false);
    u.onerror = () => setPlaying(false);
    setUsingTts(true);
    setPlaying(true);
    speechSynthesis.speak(u);
  };

  const play = async () => {
    stop();
    if (audioSrc) {
      const a = audioRef.current ?? new Audio();
      audioRef.current = a;
      a.src = audioSrc;
      a.onended = () => setPlaying(false);
      try {
        await a.play();
        setUsingTts(false);
        setPlaying(true);
        return;
      } catch {
        // file mancante o riproduzione bloccata: voce provvisoria
      }
    }
    speak();
  };

  useEffect(() => {
    if (enabled && autoPlay) play();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, enabled]);

  return (
    <div className="narration">
      <p className="narration-text">{text}</p>
      {enabled && (
        <div className="row">
          <button className="btn btn-soft" onClick={playing ? stop : play} aria-label={playing ? "Ferma la voce" : "Ascolta"}>
            {playing ? "⏸ Pausa" : "🔊 Ascolta di nuovo"}
          </button>
          {usingTts && <span className="tag">voce provvisoria</span>}
        </div>
      )}
    </div>
  );
}
