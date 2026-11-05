"use client";

import { useRef, useState } from "react";
import { allLines, characters, type CharacterId } from "@/game/content";
import { speak, stopAll, unlockAudio } from "../audio/voice";
import { CharacterArt } from "./CharacterArt";

/** Pagina di servizio: tutti i personaggi, per provare disegni e voci. */
export function Cast() {
  const [talking, setTalking] = useState<CharacterId | null>(null);
  const level = useRef(0);
  const ids = Object.keys(characters) as CharacterId[];

  const tryVoice = async (id: CharacterId) => {
    unlockAudio();
    stopAll();
    const line = allLines.find((l) => l.speaker === id);
    if (!line) return;
    setTalking(id);
    await speak(line, level).done;
    setTalking((t) => (t === id ? null : t));
  };

  return (
    <main className="screen">
      <h1>I personaggi</h1>
      <p className="muted">Toccate un personaggio per sentire la sua voce.</p>
      <div className="cast">
        {ids.map((id) => (
          <button key={id} className="cast-card" onClick={() => tryVoice(id)}>
            <CharacterArt id={id} size={130} talking={talking === id} levelRef={level} />
            <strong>{characters[id].name}</strong>
            <span className="small muted">{characters[id].role}</span>
          </button>
        ))}
      </div>
    </main>
  );
}
