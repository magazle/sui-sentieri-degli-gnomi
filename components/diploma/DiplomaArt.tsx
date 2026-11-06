"use client";

import { forwardRef } from "react";
import { missions, rewards } from "@/game/content";
import { CharacterArt } from "../characters/CharacterArt";
import { joinNames, NO_CROP, placePhoto, type Crop } from "./diplomaData";

/** Formato verticale come un foglio A4 (1:√2). */
export const W = 1000;
export const H = 1414;
/** Cornice della foto: anche l'esportazione disegna la foto qui. */
export const PHOTO = { cx: 500, cy: 560, r: 205 };

type Props = {
  names: string[];
  photo: string | null;
  photoSize?: { w: number; h: number };
  crop?: Crop;
  date: string;
  /** gesti sulla foto (trascina e pizzica), solo nell'anteprima */
  photoHandlers?: React.DOMAttributes<SVGCircleElement>;
  /** mostra il bordo tratteggiato che invita a sistemare la foto */
  editing?: boolean;
  /** in esportazione la foto viene disegnata a parte, sul canvas */
  forExport?: boolean;
};

const TITLE = "Georgia, 'Iowan Old Style', 'Palatino Linotype', serif";
const BODY = "ui-rounded, 'SF Pro Rounded', 'Nunito', 'Arial Rounded MT Bold', 'Segoe UI', sans-serif";

/** Una foglia lungo il bordo. */
const leaf = (x: number, y: number, a: number, s: number, c: string, k: string) => (
  <path key={k} d="M0 0 Q10 -9 22 0 Q10 9 0 0 Z" fill={c} transform={`translate(${x} ${y}) rotate(${a}) scale(${s})`} />
);

function vine(side: "top" | "bottom" | "left" | "right") {
  const out = [];
  const n = side === "top" || side === "bottom" ? 16 : 22;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const wob = Math.sin(i * 1.7) * 8;
    let x = 0;
    let y = 0;
    let a = 0;
    if (side === "top") [x, y, a] = [70 + t * 860, 64 + wob, i % 2 ? -30 : 210];
    if (side === "bottom") [x, y, a] = [70 + t * 860, H - 64 + wob, i % 2 ? 30 : 150];
    if (side === "left") [x, y, a] = [64 + wob, 70 + t * (H - 140), i % 2 ? 60 : -60];
    if (side === "right") [x, y, a] = [W - 64 + wob, 70 + t * (H - 140), i % 2 ? 120 : 240];
    const c = ["#6f9a3e", "#8bb553", "#557d2e", "#a6c96a"][i % 4];
    out.push(leaf(x, y, a, 1.4, c, `${side}${i}`));
  }
  return out;
}

function mushroom(x: number, y: number, s: number, k: string) {
  return (
    <g key={k} transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-9 0 Q-10 -22 0 -22 Q10 -22 9 0 Z" fill="#f4ead6" />
      <path d="M-30 -18 Q-28 -50 0 -52 Q28 -50 30 -18 Q0 -26 -30 -18 Z" fill="#d8452e" />
      <path d="M-24 -26 Q-18 -44 -2 -48" stroke="#f08a6c" strokeWidth="4" fill="none" opacity="0.6" />
      {[[-14, -36, 5], [6, -42, 6], [16, -28, 4], [-4, -28, 3.5]].map(([cx, cy, r]) => (
        <circle key={`${cx}`} cx={cx} cy={cy} r={r} fill="#fff8ec" />
      ))}
    </g>
  );
}

export const DiplomaArt = forwardRef<SVGSVGElement, Props>(function DiplomaArt({ names, photo, photoSize, crop, date, forExport, photoHandlers, editing }, ref) {
  const place = photo && photoSize ? placePhoto(photoSize, crop ?? NO_CROP, PHOTO) : null;
  const who = joinNames(names) || "Piccoli esploratori";
  const many = names.filter((n) => n.trim()).length > 1;
  const nameSize = who.length > 34 ? 46 : who.length > 22 ? 58 : 72;

  return (
    <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} className="diploma-svg" role="img" aria-label={`Diploma di custode del bosco per ${who}`}>
      <defs>
        <style>{`.diploma-svg .ch-lid{display:none}`}</style>
        <linearGradient id="dp-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e4f2f7" />
          <stop offset="0.55" stopColor="#f6f0dc" />
          <stop offset="1" stopColor="#e3ecc8" />
        </linearGradient>
        <radialGradient id="dp-paper" cx="0.5" cy="0.4" r="0.75">
          <stop offset="0" stopColor="#fffdf6" />
          <stop offset="0.8" stopColor="#fbf3df" />
          <stop offset="1" stopColor="#efe0bd" />
        </radialGradient>
        <linearGradient id="dp-ribbon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4f7d3a" />
          <stop offset="1" stopColor="#2f4f22" />
        </linearGradient>
        <linearGradient id="dp-wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c08a52" />
          <stop offset="0.5" stopColor="#8a5a30" />
          <stop offset="1" stopColor="#5a3818" />
        </linearGradient>
        <radialGradient id="dp-seal" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#e06048" />
          <stop offset="1" stopColor="#962818" />
        </radialGradient>
        <radialGradient id="dp-badge" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="1" stopColor="#f1dfb4" />
        </radialGradient>
        <radialGradient id="dp-glade" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#f6fbe8" />
          <stop offset="1" stopColor="#bcd790" />
        </radialGradient>
        <clipPath id="dp-photo">
          <circle cx={PHOTO.cx} cy={PHOTO.cy} r={PHOTO.r} />
        </clipPath>
      </defs>

      {/* fondo e foglio */}
      <rect width={W} height={H} fill="url(#dp-sky)" />
      <rect x="40" y="40" width={W - 80} height={H - 80} rx="46" fill="url(#dp-paper)" stroke="#b9945a" strokeWidth="4" />
      <rect x="62" y="62" width={W - 124} height={H - 124} rx="32" fill="none" stroke="#d9bf8a" strokeWidth="2" strokeDasharray="2 10" strokeLinecap="round" />
      {vine("top")}
      {vine("bottom")}
      {vine("left")}
      {vine("right")}
      {mushroom(96, 118, 1, "m1")}
      {mushroom(W - 96, 118, 1, "m2")}
      {mushroom(110, H - 86, 1.1, "m3")}
      {mushroom(W - 110, H - 86, 1.1, "m4")}

      {/* nastro con la scritta */}
      <path d="M190 150 L810 150 L790 192 L810 234 L190 234 L210 192 Z" fill="url(#dp-ribbon)" />
      <path d="M150 170 L210 170 L210 250 L150 250 L172 210 Z" fill="#2a4419" />
      <path d="M850 170 L790 170 L790 250 L850 250 L828 210 Z" fill="#2a4419" />
      <text x="500" y="207" textAnchor="middle" fontFamily={TITLE} fontSize="44" letterSpacing="14" fill="#fdf6e3" fontWeight="700">
        DIPLOMA
      </text>
      <text x="500" y="310" textAnchor="middle" fontFamily={TITLE} fontSize="74" fontWeight="700" fill="#2f4a2b">
        Custode del Bosco
      </text>

      {/* foto in una cornice di legno con foglie */}
      <circle cx={PHOTO.cx} cy={PHOTO.cy} r={PHOTO.r + 22} fill="url(#dp-wood)" />
      <circle cx={PHOTO.cx} cy={PHOTO.cy} r={PHOTO.r + 22} fill="none" stroke="#3e2410" strokeWidth="3" />
      {Array.from({ length: 10 }, (_, i) => (
        <path
          key={i}
          d={`M${PHOTO.cx + Math.cos(i * 0.63) * (PHOTO.r + 6)} ${PHOTO.cy + Math.sin(i * 0.63) * (PHOTO.r + 6)} a${PHOTO.r + 10} ${PHOTO.r + 10} 0 0 1 ${Math.cos(i * 0.63 + 1.5) * 26} ${Math.sin(i * 0.63 + 1.5) * 26}`}
          stroke="#e0b47c"
          strokeWidth="2"
          fill="none"
          opacity="0.5"
        />
      ))}
      <circle cx={PHOTO.cx} cy={PHOTO.cy} r={PHOTO.r} fill="url(#dp-glade)" />
      {!photo && !forExport && (
        <g opacity="0.95">
          <text x={PHOTO.cx} y={PHOTO.cy - 10} textAnchor="middle" fontSize="90">
            📷
          </text>
          <text x={PHOTO.cx} y={PHOTO.cy + 70} textAnchor="middle" fontFamily={BODY} fontSize="32" fill="#4d6a35" fontWeight="700">
            Qui va la vostra foto
          </text>
        </g>
      )}
      {!photo && forExport && (
        <g transform={`translate(${PHOTO.cx - 150} ${PHOTO.cy - 160})`}>
          <CharacterArt id="querce" size={300} />
        </g>
      )}
      {photo && !forExport && (
        <g clipPath="url(#dp-photo)">
          {place ? (
            <image href={photo} x={place.x} y={place.y} width={place.w} height={place.h} preserveAspectRatio="none" />
          ) : (
            <image href={photo} x={PHOTO.cx - PHOTO.r} y={PHOTO.cy - PHOTO.r} width={PHOTO.r * 2} height={PHOTO.r * 2} preserveAspectRatio="xMidYMid slice" />
          )}
        </g>
      )}
      {/* foglie e ghiande sulla cornice */}
      {[[-150, -150, -40], [140, -160, 40], [-200, 40, -100], [196, 60, 100]].map(([dx, dy, a], i) => (
        <g key={i} transform={`translate(${PHOTO.cx + dx} ${PHOTO.cy + dy}) rotate(${a})`}>
          <path d="M0 0 Q22 -20 50 0 Q22 20 0 0 Z" fill="#6f9a3e" />
          <path d="M0 0 Q22 -20 50 0 Q22 20 0 0 Z" fill="none" stroke="#3f6224" strokeWidth="2" />
          <path d="M4 0 L44 0" stroke="#3f6224" strokeWidth="2" />
        </g>
      ))}
      {[[PHOTO.cx - 30, PHOTO.cy + PHOTO.r + 18], [PHOTO.cx + 30, PHOTO.cy + PHOTO.r + 18]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${i ? 15 : -15})`}>
          <ellipse cx="0" cy="8" rx="14" ry="19" fill="#c98b3c" />
          <path d="M-16 -2 Q0 -18 16 -2 Q0 6 -16 -2 Z" fill="#6a4a28" />
        </g>
      ))}

      {photo && !forExport && photoHandlers && (
        <circle cx={PHOTO.cx} cy={PHOTO.cy} r={PHOTO.r} fill="transparent" className="dp-photo-touch" {...photoHandlers} />
      )}
      {photo && !forExport && editing && (
        <circle cx={PHOTO.cx} cy={PHOTO.cy} r={PHOTO.r - 6} fill="none" stroke="#ffffff" strokeWidth="5" strokeDasharray="14 12" opacity="0.9" pointerEvents="none" />
      )}

      {/* nomi */}
      <text x="500" y="850" textAnchor="middle" fontFamily={BODY} fontSize="34" fill="#55604c">
        Il bosco del Parco di Monza nomina
      </text>
      <text x="500" y={850 + 30 + nameSize} textAnchor="middle" fontFamily={TITLE} fontSize={nameSize} fontWeight="700" fill="#c8402f">
        {who}
      </text>
      <text x="500" y={850 + 90 + nameSize} textAnchor="middle" fontFamily={BODY} fontSize="34" fill="#55604c">
        {many ? "custodi del bosco, per aver ritrovato" : "custode del bosco, per aver ritrovato"}
      </text>
      <text x="500" y={850 + 136 + nameSize} textAnchor="middle" fontFamily={BODY} fontSize="34" fill="#55604c">
        i cinque segreti magici.
      </text>

      {/* i cinque segreti */}
      {missions.map((m, i) => {
        const x = 220 + i * 140;
        const y = 1130;
        return (
          <g key={m.id}>
            <circle cx={x} cy={y} r="54" fill="url(#dp-badge)" stroke="#c9a463" strokeWidth="4" />
            <text x={x} y={y + 20} textAnchor="middle" fontSize="54">
              {rewards[m.rewardId].emoji}
            </text>
          </g>
        );
      })}

      {/* firma di Bastiano, data e sigillo */}
      <g transform="translate(120 1196)">
        <CharacterArt id="bastiano" size={136} />
      </g>
      <text x="292" y="1262" fontFamily="'Snell Roundhand', 'Brush Script MT', 'Segoe Script', cursive" fontSize="46" fill="#3b2a1d">
        Bastiano
      </text>
      <path d="M288 1274 Q400 1268 470 1276" stroke="#3b2a1d" strokeWidth="2" fill="none" />
      <text x="292" y="1304" fontFamily={BODY} fontSize="22" fill="#6d6250">
        gnomo custode di Cascina Bastia
      </text>
      <text x="292" y="1332" fontFamily={BODY} fontSize="22" fill="#6d6250">
        {date}
      </text>
      <g transform="translate(790 1262)">
        <circle r="66" fill="url(#dp-seal)" />
        <circle r="54" fill="none" stroke="#f5b09c" strokeWidth="3" strokeDasharray="5 6" />
        <ellipse cx="0" cy="8" rx="18" ry="24" fill="#f8d9a0" />
        <path d="M-22 -4 Q0 -26 22 -4 Q0 6 -22 -4 Z" fill="#f2c27a" />
        <path d="M0 -14 l2 -8" stroke="#f8d9a0" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
});
