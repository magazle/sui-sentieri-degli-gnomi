"use client";

import { characters, type CharacterId, type Line } from "@/game/content";

/**
 * Motore voce.
 * 1. File audio registrato/generato (/audio/it/<id>.mp3): voce vera, con la
 *    bocca del personaggio sincronizzata al volume reale (AnalyserNode).
 * 2. Se il file manca: voce sintetica del telefono, scegliendo la voce italiana
 *    migliore disponibile e un timbro diverso per ogni personaggio.
 */

let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let audioEl: HTMLAudioElement | null = null;
const missing = new Set<string>();

/** Va chiamata dentro un tocco dell'utente (sblocca l'audio su iOS). */
export function unlockAudio() {
  if (typeof window === "undefined") return;
  try {
    if (!ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctx();
    }
    if (ctx.state === "suspended") ctx.resume();
    if (!audioEl) {
      audioEl = new Audio();
      audioEl.crossOrigin = "anonymous";
      audioEl.preload = "auto";
      const src = ctx.createMediaElementSource(audioEl);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      analyser.connect(ctx.destination);
    }
    // iOS: una frase vuota sblocca anche la sintesi vocale
    if ("speechSynthesis" in window && !speechSynthesis.speaking) {
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      speechSynthesis.speak(u);
    }
  } catch {}
}

/* ---------- scelta delle voci sintetiche ---------- */

const FEMALE = /alice|federica|elsa|isabella|paola|emma|bianca|carla|chiara|giulia|silvia|francesca|irene|fiamma|valentina|female|donna/i;
const MALE = /luca|diego|cosimo|giuseppe|benigno|calogero|marcello|rinaldo|gianni|riccardo|male|uomo/i;
const QUALITY = /premium|enhanced|natural|neural|online|siri|wavenet|studio/i;

function score(v: SpeechSynthesisVoice) {
  let s = 0;
  if (QUALITY.test(v.name)) s += 10;
  if (v.lang === "it-IT") s += 2;
  if (!v.localService) s += 1; // le voci di rete sono di solito più naturali
  return s;
}

let cached: { male?: SpeechSynthesisVoice; female?: SpeechSynthesisVoice; any?: SpeechSynthesisVoice } | null = null;
function pickVoices() {
  if (cached || typeof speechSynthesis === "undefined") return cached ?? {};
  const it = speechSynthesis.getVoices().filter((v) => v.lang?.toLowerCase().startsWith("it"));
  if (!it.length) return {};
  const best = (pred: (v: SpeechSynthesisVoice) => boolean) => it.filter(pred).sort((a, b) => score(b) - score(a))[0];
  cached = {
    female: best((v) => FEMALE.test(v.name)) ?? best((v) => /google/i.test(v.name)),
    male: best((v) => MALE.test(v.name)),
    any: best(() => true),
  };
  return cached;
}
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  speechSynthesis.onvoiceschanged = () => {
    cached = null;
  };
}

/* ---------- riproduzione ---------- */

export type Playback = { stop: () => void; done: Promise<void> };

function playFile(line: Line, level: { current: number }): Playback | null {
  if (!audioEl || !analyser || missing.has(line.audioSrc)) return null;
  const a = audioEl;
  const an = analyser;
  const buf = new Uint8Array(an.fftSize);
  let raf = 0;
  let stopped = false;
  const meter = () => {
    an.getByteTimeDomainData(buf);
    let sum = 0;
    for (const b of buf) sum += ((b - 128) / 128) ** 2;
    level.current = Math.min(1, Math.sqrt(sum / buf.length) * 5);
    raf = requestAnimationFrame(meter);
  };
  const done = new Promise<void>((resolve, reject) => {
    a.onended = () => resolve();
    a.onerror = () => {
      missing.add(line.audioSrc);
      reject(new Error("missing"));
    };
    a.src = line.audioSrc;
    a.currentTime = 0;
    a.play().then(() => {
      raf = requestAnimationFrame(meter);
    }, reject);
  }).finally(() => {
    cancelAnimationFrame(raf);
    level.current = 0;
  });
  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      a.pause();
      a.onended?.(new Event("ended"));
    },
    done,
  };
}

function playTts(line: Line, level: { current: number }): Playback {
  const ch = characters[line.speaker as CharacterId];
  let raf = 0;
  let pulse = 0;
  let speaking = false;
  const start = performance.now();
  // Senza accesso al segnale della voce sintetica, la bocca si muove su
  // un ritmo di sillabe, con un colpo a ogni parola.
  const animate = () => {
    const t = (performance.now() - start) / 1000;
    const syll = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 4.2) * Math.sin(t * 2 * Math.PI * 1.3 + 1);
    pulse *= 0.86;
    level.current = speaking ? Math.min(1, 0.25 + syll * 0.55 + pulse) : 0;
    raf = requestAnimationFrame(animate);
  };
  const done = new Promise<void>((resolve) => {
    if (typeof speechSynthesis === "undefined") {
      resolve();
      return;
    }
    const u = new SpeechSynthesisUtterance(line.text);
    const v = pickVoices();
    const voice = (ch.tts.gender === "male" ? v.male : v.female) ?? v.any;
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? "it-IT";
    // Se la voce del genere giusto non c'è, il timbro si ottiene col tono.
    const wrongGender = !(ch.tts.gender === "male" ? v.male : v.female);
    u.pitch = Math.max(0.1, Math.min(2, ch.tts.pitch * (wrongGender && ch.tts.gender === "male" ? 0.8 : 1)));
    u.rate = ch.tts.rate;
    u.onstart = () => {
      speaking = true;
    };
    u.onboundary = () => {
      pulse = 0.35;
    };
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
    raf = requestAnimationFrame(animate);
  }).finally(() => {
    speaking = false;
    cancelAnimationFrame(raf);
    level.current = 0;
  });
  return {
    stop: () => {
      speechSynthesis.cancel();
    },
    done,
  };
}

/** Dice una battuta: file vero se c'è, altrimenti voce sintetica. */
export function speak(line: Line, level: { current: number }): { stop: () => void; done: Promise<"file" | "tts"> } {
  let current: Playback | null = playFile(line, level);
  let cancelled = false;
  const done = (async (): Promise<"file" | "tts"> => {
    if (current) {
      try {
        await current.done;
        return "file";
      } catch {
        if (cancelled) return "file";
      }
    }
    current = playTts(line, level);
    await current.done;
    return "tts";
  })();
  return {
    stop: () => {
      cancelled = true;
      current?.stop();
    },
    done,
  };
}

export function stopAll() {
  audioEl?.pause();
  if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
}
