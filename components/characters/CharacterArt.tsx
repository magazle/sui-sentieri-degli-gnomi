"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { CharacterId } from "@/game/content";

/**
 * Personaggi originali disegnati in SVG.
 * Ogni personaggio ha:
 *  - .ch-breathe  respiro (CSS)
 *  - .ch-blink    battito di ciglia (CSS)
 *  - [data-mouth] bocca: un'ellisse la cui apertura segue il volume della voce
 * L'apertura viene aggiornata fuori da React (requestAnimationFrame) per restare fluida.
 */

type MouthSpec = { cx: number; cy: number; rx: number; max: number; fill?: string };

type Art = { body: ReactNode; mouth: MouthSpec; front?: ReactNode };

const eye = (cx: number, cy: number, r = 6) => (
  <g className="ch-blink">
    <circle cx={cx} cy={cy} r={r} fill="#2a1d14" />
    <circle cx={cx + r * 0.35} cy={cy - r * 0.35} r={r * 0.33} fill="#fff" />
  </g>
);

const ART: Record<CharacterId, Art> = {
  /* ---------- Bastiano, lo gnomo custode ---------- */
  bastiano: {
    body: (
      <>
        <ellipse cx="100" cy="212" rx="52" ry="7" fill="#000" opacity="0.12" />
        {/* corpo e stivali */}
        <rect x="70" y="190" width="24" height="18" rx="8" fill="#5a3a22" />
        <rect x="106" y="190" width="24" height="18" rx="8" fill="#5a3a22" />
        <path d="M58 200 Q60 140 100 136 Q140 140 142 200 Z" fill="#4f7d3a" />
        <rect x="60" y="178" width="80" height="9" rx="4" fill="#6b4423" />
        <rect x="93" y="176" width="14" height="13" rx="3" fill="#e2b13c" />
        {/* braccia */}
        <ellipse cx="56" cy="170" rx="11" ry="20" fill="#4f7d3a" transform="rotate(18 56 170)" />
        <ellipse cx="144" cy="170" rx="11" ry="20" fill="#4f7d3a" transform="rotate(-18 144 170)" />
        <circle cx="50" cy="186" r="9" fill="#f1c6a2" />
        <circle cx="150" cy="186" r="9" fill="#f1c6a2" />
        {/* viso */}
        <circle cx="100" cy="100" r="36" fill="#f6d2b3" />
        <circle cx="76" cy="108" r="8" fill="#f2a08c" opacity="0.6" />
        <circle cx="124" cy="108" r="8" fill="#f2a08c" opacity="0.6" />
        {/* barba */}
        <path d="M62 104 Q64 168 100 176 Q136 168 138 104 Q124 120 100 120 Q76 120 62 104 Z" fill="#f4f1ea" />
        <path d="M70 112 Q78 150 100 160 Q122 150 130 112" fill="none" stroke="#e1dccf" strokeWidth="3" />
        {/* baffi */}
        <path d="M100 116 Q86 108 76 118 Q88 124 100 120 Q112 124 124 118 Q114 108 100 116 Z" fill="#fff" />
        {/* cappello */}
        <path d="M58 86 Q70 20 132 6 Q120 40 142 86 Z" fill="#c8402f" />
        <path d="M56 84 Q100 72 144 84 Q146 94 138 96 Q100 86 62 96 Q54 94 56 84 Z" fill="#a8301f" />
        {/* sopracciglia */}
        <path d="M78 88 Q86 82 94 88" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M106 88 Q114 82 122 88" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" />
        {eye(86, 98, 5)}
        {eye(114, 98, 5)}
      </>
    ),
    mouth: { cx: 100, cy: 128, rx: 8, max: 9 },
    // il naso resta sopra la bocca
    front: <ellipse cx="100" cy="110" rx="10" ry="9" fill="#ef9f86" />,
  },

  /* ---------- Fagiolina, la strega gentile ---------- */
  fagiolina: {
    body: (
      <>
        <ellipse cx="100" cy="212" rx="50" ry="7" fill="#000" opacity="0.12" />
        {/* scopa */}
        <rect x="140" y="110" width="6" height="96" rx="3" fill="#8a5a2b" transform="rotate(12 143 158)" />
        <path d="M150 196 L132 214 L170 214 Z" fill="#e2b13c" transform="rotate(12 151 205)" />
        {/* vestito */}
        <path d="M60 208 Q66 140 100 134 Q134 140 140 208 Z" fill="#7b4fa6" />
        <path d="M84 150 L100 168 L116 150" fill="none" stroke="#f2b705" strokeWidth="4" strokeLinejoin="round" />
        <ellipse cx="62" cy="168" rx="10" ry="20" fill="#7b4fa6" transform="rotate(20 62 168)" />
        <ellipse cx="138" cy="168" rx="10" ry="20" fill="#7b4fa6" transform="rotate(-20 138 168)" />
        <circle cx="56" cy="184" r="8" fill="#f6d2b3" />
        <circle cx="144" cy="184" r="8" fill="#f6d2b3" />
        {/* trecce */}
        <path d="M66 96 Q48 130 58 150" stroke="#e0662c" strokeWidth="13" strokeLinecap="round" fill="none" />
        <path d="M134 96 Q152 130 142 150" stroke="#e0662c" strokeWidth="13" strokeLinecap="round" fill="none" />
        <circle cx="58" cy="152" r="6" fill="#8aa35a" />
        <circle cx="142" cy="152" r="6" fill="#8aa35a" />
        {/* viso */}
        <circle cx="100" cy="104" r="35" fill="#f8dcc2" />
        <path d="M66 92 Q80 70 100 74 Q120 70 134 92 Q118 84 100 86 Q82 84 66 92 Z" fill="#e0662c" />
        <circle cx="78" cy="114" r="7" fill="#f2a08c" opacity="0.55" />
        <circle cx="122" cy="114" r="7" fill="#f2a08c" opacity="0.55" />
        {[ [80, 108], [85, 112], [76, 113], [120, 108], [115, 112], [124, 113] ].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="1.4" fill="#c2774f" />
        ))}
        {/* cappello */}
        <ellipse cx="100" cy="78" rx="62" ry="12" fill="#5e3a86" />
        <path d="M70 78 Q78 30 96 10 Q104 0 118 8 Q108 20 112 34 Q122 58 130 78 Z" fill="#7b4fa6" />
        <rect x="72" y="66" width="56" height="9" rx="3" fill="#f2b705" />
        <path d="M108 40 l3 6 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1 Z" fill="#f2b705" />
        {eye(88, 102, 6)}
        {eye(112, 102, 6)}
        <path d="M80 92 Q88 88 94 92" stroke="#c4562a" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M106 92 Q112 88 120 92" stroke="#c4562a" strokeWidth="3" strokeLinecap="round" fill="none" />
      </>
    ),
    mouth: { cx: 100, cy: 124, rx: 9, max: 9 },
    front: <path d="M97 108 Q100 116 104 112" stroke="#d9906d" strokeWidth="3" fill="none" strokeLinecap="round" />,
  },

  /* ---------- Rimario, il gufo poeta ---------- */
  rimario: {
    body: (
      <>
        <ellipse cx="100" cy="212" rx="50" ry="7" fill="#000" opacity="0.12" />
        {/* zampe */}
        <path d="M82 198 l-6 12 M86 198 l0 13 M90 198 l6 12" stroke="#e2a23c" strokeWidth="4" strokeLinecap="round" />
        <path d="M110 198 l-6 12 M114 198 l0 13 M118 198 l6 12" stroke="#e2a23c" strokeWidth="4" strokeLinecap="round" />
        {/* corpo */}
        <ellipse cx="100" cy="130" rx="62" ry="74" fill="#8a6142" />
        <ellipse cx="100" cy="150" rx="40" ry="48" fill="#d9bf98" />
        {[0, 1, 2].map((r) =>
          [-1, 0, 1].map((c) => (
            <path key={`${r}${c}`} d={`M${92 + c * 16} ${136 + r * 16} q8 7 16 0`} stroke="#b89670" strokeWidth="3" fill="none" />
          )),
        )}
        {/* ali */}
        <path d="M40 120 Q26 170 56 196 Q66 160 58 122 Z" fill="#6f4c33" />
        <path d="M160 120 Q174 170 144 196 Q134 160 142 122 Z" fill="#6f4c33" />
        {/* penna d'oca */}
        <path d="M150 182 Q176 140 184 112 Q166 134 146 178 Z" fill="#fff" stroke="#ddd" />
        <line x1="148" y1="180" x2="182" y2="114" stroke="#bbb" strokeWidth="1.5" />
        {/* ciuffi */}
        <path d="M52 70 L46 32 L78 58 Z" fill="#6f4c33" />
        <path d="M148 70 L154 32 L122 58 Z" fill="#6f4c33" />
        {/* dischi facciali */}
        <circle cx="76" cy="88" r="27" fill="#f1e2c6" />
        <circle cx="124" cy="88" r="27" fill="#f1e2c6" />
        {eye(76, 88, 12)}
        {eye(124, 88, 12)}
        {/* occhiali */}
        <circle cx="76" cy="88" r="20" fill="none" stroke="#3b2a1d" strokeWidth="4" />
        <circle cx="124" cy="88" r="20" fill="none" stroke="#3b2a1d" strokeWidth="4" />
        <path d="M96 86 Q100 82 104 86" stroke="#3b2a1d" strokeWidth="4" fill="none" />
        {/* sciarpa */}
        <path d="M58 132 Q100 150 142 132 L142 142 Q100 160 58 142 Z" fill="#c8402f" />
      </>
    ),
    mouth: { cx: 100, cy: 120, rx: 6, max: 8, fill: "#7a3d12" },
    // becco sopra la bocca: la bocca si vede come apertura sotto il becco
    front: <path d="M90 104 L110 104 L100 122 Z" fill="#e2a23c" />,
  },

  /* ---------- Plin, l'ondina ---------- */
  plin: {
    body: (
      <>
        <defs>
          <radialGradient id="plin-g" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#e6f6ff" />
            <stop offset="60%" stopColor="#8fd0f2" />
            <stop offset="100%" stopColor="#4ba3d6" />
          </radialGradient>
        </defs>
        <ellipse cx="100" cy="212" rx="44" ry="6" fill="#2f7de1" opacity="0.15" />
        {/* corpo a goccia */}
        <path d="M100 30 Q150 100 150 148 Q150 204 100 204 Q50 204 50 148 Q50 100 100 30 Z" fill="url(#plin-g)" opacity="0.95" />
        <path d="M74 150 Q70 120 86 96" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.7" />
        {/* capelli d'acqua */}
        <path d="M58 132 Q40 120 52 100 Q46 124 64 128" fill="#4ba3d6" />
        <path d="M142 132 Q160 120 148 100 Q154 124 136 128" fill="#4ba3d6" />
        {/* corona di gocce */}
        {[78, 100, 122].map((x, i) => (
          <path key={x} d={`M${x} ${66 - (i === 1 ? 10 : 0)} q6 10 0 14 q-6 -4 0 -14 Z`} fill="#fff" opacity="0.9" />
        ))}
        <circle cx="80" cy="150" r="7" fill="#f7a8c4" opacity="0.5" />
        <circle cx="120" cy="150" r="7" fill="#f7a8c4" opacity="0.5" />
        {eye(86, 138, 7)}
        {eye(114, 138, 7)}
        {/* bollicine */}
        <circle className="ch-bubble" cx="160" cy="80" r="5" fill="none" stroke="#8fd0f2" strokeWidth="2" />
        <circle className="ch-bubble ch-bubble-2" cx="40" cy="70" r="4" fill="none" stroke="#8fd0f2" strokeWidth="2" />
      </>
    ),
    mouth: { cx: 100, cy: 160, rx: 6, max: 7, fill: "#2b5f88" },
  },

  /* ---------- Sassolino, il coboldo ---------- */
  sassolino: {
    body: (
      <>
        <ellipse cx="100" cy="212" rx="50" ry="7" fill="#000" opacity="0.12" />
        {/* piedi */}
        <ellipse cx="80" cy="204" rx="16" ry="8" fill="#5f6b4e" />
        <ellipse cx="120" cy="204" rx="16" ry="8" fill="#5f6b4e" />
        {/* corpo */}
        <ellipse cx="100" cy="168" rx="40" ry="36" fill="#7c5b3d" />
        <path d="M70 160 Q100 176 130 160 L132 178 Q100 194 68 178 Z" fill="#5a3f28" />
        {/* lanterna */}
        <line x1="142" y1="150" x2="150" y2="176" stroke="#3b2a1d" strokeWidth="3" />
        <rect x="142" y="176" width="16" height="20" rx="4" fill="#f2b705" stroke="#3b2a1d" strokeWidth="3" />
        <circle className="ch-glow" cx="150" cy="186" r="14" fill="#f2b705" opacity="0.25" />
        {/* orecchie */}
        <path d="M58 98 L10 70 L52 122 Z" fill="#8ea36d" />
        <path d="M142 98 L190 70 L148 122 Z" fill="#8ea36d" />
        <path d="M54 104 L26 82 L52 116 Z" fill="#c9a0a0" />
        <path d="M146 104 L174 82 L148 116 Z" fill="#c9a0a0" />
        {/* testa */}
        <circle cx="100" cy="104" r="44" fill="#9db37b" />
        {/* elmetto da minatore */}
        <path d="M58 92 Q60 52 100 50 Q140 52 142 92 Z" fill="#c8402f" />
        <rect x="54" y="88" width="92" height="8" rx="4" fill="#a8301f" />
        <circle cx="100" cy="70" r="9" fill="#fff6c9" stroke="#a8301f" strokeWidth="3" />
        {eye(84, 106, 8)}
        {eye(116, 106, 8)}
        <path d="M74 97 Q83 90 92 94" fill="none" stroke="#5f6b4e" strokeWidth="4" strokeLinecap="round" />
        <path d="M126 97 Q117 90 108 94" fill="none" stroke="#5f6b4e" strokeWidth="4" strokeLinecap="round" />
      </>
    ),
    mouth: { cx: 100, cy: 132, rx: 11, max: 9, fill: "#3b1f17" },
    front: (
      <>
        <ellipse cx="100" cy="120" rx="11" ry="9" fill="#86a065" />
        <rect x="94" y="130" width="5" height="5" fill="#fff" />
        <rect x="101" y="130" width="5" height="5" fill="#fff" />
      </>
    ),
  },

  /* ---------- Nonna Quercia e il fratello gemello ---------- */
  querce: {
    body: (
      <>
        <ellipse cx="100" cy="212" rx="90" ry="8" fill="#000" opacity="0.12" />
        {/* chiome */}
        <circle cx="62" cy="56" r="44" fill="#557a3a" />
        <circle cx="30" cy="78" r="28" fill="#4a6c32" />
        <circle cx="92" cy="80" r="30" fill="#628a43" />
        <circle cx="146" cy="70" r="36" fill="#628a43" />
        <circle cx="176" cy="92" r="22" fill="#557a3a" />
        <circle cx="128" cy="96" r="22" fill="#4a6c32" />
        {/* ghiande */}
        {[[40, 60], [84, 46], [150, 56], [170, 86]].map(([x, y]) => (
          <g key={`${x}${y}`}>
            <ellipse cx={x} cy={y + 5} rx="5" ry="7" fill="#c98b3c" />
            <path d={`M${x - 6} ${y + 1} Q${x} ${y - 6} ${x + 6} ${y + 1} Z`} fill="#7a5130" />
          </g>
        ))}
        {/* tronco di Nonna Quercia */}
        <path d="M40 210 Q50 160 46 110 L92 110 Q86 160 98 210 Z" fill="#7a5130" />
        <path d="M56 200 Q60 160 56 124 M80 204 Q74 168 80 128" stroke="#5f3d22" strokeWidth="3" fill="none" />
        {/* tronco del fratello */}
        <path d="M118 210 Q128 168 124 122 L160 122 Q156 168 166 210 Z" fill="#87603c" />
        <path d="M134 200 Q138 170 134 136" stroke="#6b4a2c" strokeWidth="3" fill="none" />
        {/* viso della nonna */}
        <path d="M54 138 Q62 132 68 138" stroke="#9ec27a" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M74 138 Q80 132 88 138" stroke="#9ec27a" strokeWidth="5" strokeLinecap="round" fill="none" />
        {eye(61, 148, 5)}
        {eye(81, 148, 5)}
        <circle cx="54" cy="160" r="5" fill="#c97a5a" opacity="0.5" />
        <circle cx="88" cy="160" r="5" fill="#c97a5a" opacity="0.5" />
        {/* il fratello sonnecchia e sorride */}
        <path d="M132 154 Q137 158 142 154 M148 154 Q153 158 158 154" stroke="#3b2a1d" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M138 168 Q145 174 152 168" stroke="#3b2a1d" strokeWidth="3" strokeLinecap="round" fill="none" />
      </>
    ),
    mouth: { cx: 71, cy: 170, rx: 8, max: 8, fill: "#3b2414" },
  },
};

export function CharacterArt({
  id,
  levelRef,
  talking,
  size = 180,
}: {
  id: CharacterId;
  /** volume della voce 0..1, letto a ogni frame */
  levelRef?: React.RefObject<number>;
  talking?: boolean;
  size?: number;
}) {
  const mouthRef = useRef<SVGEllipseElement>(null);
  const art = ART[id];

  useEffect(() => {
    let raf = 0;
    let smooth = 0;
    const loop = () => {
      const target = talking ? Math.min(1, Math.max(0, levelRef?.current ?? 0)) : 0;
      smooth += (target - smooth) * 0.35;
      const el = mouthRef.current;
      if (el) {
        el.setAttribute("ry", String(1.6 + smooth * art.mouth.max));
        el.setAttribute("rx", String(art.mouth.rx * (1 - smooth * 0.25)));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [talking, levelRef, art]);

  return (
    <svg
      viewBox="0 0 200 220"
      width={size}
      height={size * 1.1}
      className={`character-art ${talking ? "is-talking" : ""}`}
      role="img"
      aria-hidden
    >
      <g className="ch-bob">
        <g className="ch-breathe">
          {art.body}
          <ellipse ref={mouthRef} data-mouth cx={art.mouth.cx} cy={art.mouth.cy} rx={art.mouth.rx} ry="1.6" fill={art.mouth.fill ?? "#7a2a22"} />
          {art.front}
        </g>
      </g>
    </svg>
  );
}
