"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import type { CharacterId } from "@/game/content";

/**
 * Personaggi originali in SVG, stile illustrazione da libro: luce da sinistra
 * in alto, volumi sfumati, ombre di contatto, occhi con iride e palpebra.
 * Niente filtri SVG: restano fluidi anche sui telefoni durante le animazioni.
 *
 * Animazioni:
 *  - .ch-breathe  respiro (CSS)
 *  - .ch-lid      palpebre che si chiudono (CSS)
 *  - [data-mouth] cavità della bocca, aperta in base al volume della voce
 */

type MouthSpec = { cx: number; cy: number; rx: number; max: number; fill?: string };
type Art = { body: ReactNode; mouth: MouthSpec; front?: ReactNode };
type Ids = (name: string) => string;

/* ---------- strumenti di disegno ---------- */

type Stop = [number, string, number?];
const stops = (s: Stop[]) => s.map(([o, c, a], i) => <stop key={i} offset={o} stopColor={c} stopOpacity={a ?? 1} />);

const rg = (id: string, s: Stop[], cx = 0.4, cy = 0.35, r = 0.75) => (
  <radialGradient id={id} cx={cx} cy={cy} r={r}>
    {stops(s)}
  </radialGradient>
);
const lg = (id: string, s: Stop[], x1 = 0, y1 = 0, x2 = 0, y2 = 1) => (
  <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
    {stops(s)}
  </linearGradient>
);
/** Macchia morbida: colore pieno al centro, trasparente ai bordi. */
const soft = (id: string, color: string, a = 1) => rg(id, [[0, color, a], [1, color, 0]], 0.5, 0.5, 0.5);

/** Ciocche, peli, venature: tante linee sottili generate da una funzione. */
function strands(n: number, d: (i: number, t: number) => string, stroke: string, width = 1, opacity = 0.5) {
  return Array.from({ length: n }, (_, i) => (
    <path key={i} d={d(i, n > 1 ? i / (n - 1) : 0)} stroke={stroke} strokeWidth={width} opacity={opacity} fill="none" strokeLinecap="round" />
  ));
}

/**
 * Occhio a mandorla con sclera, iride sfumata, pupilla, riflessi e palpebra
 * superiore che si abbassa (classe .ch-lid). `tilt` inclina l'occhio.
 */
function eye(u: Ids, key: string, o: { cx: number; cy: number; w: number; h: number; iris: string; irisDark: string; lid: string; line?: string; lashes?: boolean; outer?: "left" | "right"; tilt?: number; look?: number }) {
  const { cx, cy, w, h, tilt = 0, look = 0 } = o;
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const almond = `M${x0} ${cy} Q${cx} ${cy - h * 1.2} ${x1} ${cy} Q${cx} ${cy + h * 0.85} ${x0} ${cy} Z`;
  const r = h * 0.62;
  const ix = cx + look;
  return (
    <g transform={`rotate(${tilt} ${cx} ${cy})`}>
      <defs>
        <clipPath id={u(`clip-${key}`)}>
          <path d={almond} />
        </clipPath>
        {rg(u(`iris-${key}`), [[0, o.iris], [0.55, o.iris], [1, o.irisDark]], 0.5, 0.45, 0.55)}
      </defs>
      <path d={almond} fill="#f6efe7" />
      <g clipPath={`url(#${u(`clip-${key}`)})`}>
        <circle cx={ix} cy={cy - h * 0.12} r={r} fill={`url(#${u(`iris-${key}`)})`} />
        <circle cx={ix} cy={cy - h * 0.12} r={r} fill="none" stroke={o.irisDark} strokeWidth={r * 0.14} opacity="0.7" />
        <circle cx={ix} cy={cy - h * 0.12} r={r * 0.45} fill="#15100c" />
        <circle cx={ix - r * 0.38} cy={cy - h * 0.12 - r * 0.38} r={r * 0.24} fill="#fff" opacity="0.95" />
        <circle cx={ix + r * 0.35} cy={cy - h * 0.12 + r * 0.3} r={r * 0.1} fill="#fff" opacity="0.7" />
        {/* ombra della palpebra sulla sclera */}
        <rect x={x0} y={cy - h} width={w} height={h * 0.42} fill="#3b2418" opacity="0.1" />
        <rect className="ch-lid" x={x0 - 1} y={cy - h * 1.2} width={w + 2} height={h * 2.4} fill={o.lid} />
      </g>
      <path d={`M${x0} ${cy} Q${cx} ${cy - h * 1.2} ${x1} ${cy}`} stroke={o.line ?? "#3b2418"} strokeWidth={h * 0.2} fill="none" strokeLinecap="round" />
      <path d={`M${x0 + w * 0.12} ${cy + h * 0.2} Q${cx} ${cy + h * 0.7} ${x1 - w * 0.12} ${cy + h * 0.2}`} stroke={o.line ?? "#3b2418"} strokeWidth={h * 0.08} opacity="0.3" fill="none" />
      {o.lashes && (
        <path
          d={o.outer === "left" ? `M${x0 + 0.5} ${cy - 0.5} l-2.6 -2 M${x0 + 2.5} ${cy - h * 0.45} l-2 -2.6` : `M${x1 - 0.5} ${cy - 0.5} l2.6 -2 M${x1 - 2.5} ${cy - h * 0.45} l2 -2.6`}
          stroke={o.line ?? "#3b2418"}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      )}
    </g>
  );
}

const shadow = (u: Ids, cx: number, rx: number) => (
  <>
    <defs>{soft(u("ground"), "#2b2216", 0.35)}</defs>
    <ellipse cx={cx} cy="212" rx={rx} ry="9" fill={`url(#${u("ground")})`} />
  </>
);

/* ---------- personaggi ---------- */

function bastiano(u: Ids): Art {
  return {
    body: (
      <>
        <defs>
          {rg(u("skin"), [[0, "#f6d2b6"], [0.6, "#eab394"], [1, "#c98668"]], 0.38, 0.38, 0.7)}
          {rg(u("nose"), [[0, "#f6b9a0"], [0.7, "#df8e74"], [1, "#b8674f"]], 0.35, 0.3, 0.75)}
          {soft(u("cheek"), "#e0786a", 0.55)}
          {lg(u("hat"), [[0, "#d4513a"], [0.55, "#ab3324"], [1, "#6f1d14"]], 0, 0, 1, 0.3)}
          {lg(u("wool"), [[0, "#6f9550"], [0.5, "#4d7535"], [1, "#2f4c22"]], 0, 0, 1, 0.4)}
          {lg(u("beard"), [[0, "#fbfaf6"], [0.6, "#e7e3da"], [1, "#b9b3a6"]], 0, 0, 0.3, 1)}
          {lg(u("leather"), [[0, "#7a5034"], [1, "#3d2414"]])}
          {lg(u("brass"), [[0, "#f3d27a"], [0.5, "#c99a35"], [1, "#8a6420"]])}
          {soft(u("brim"), "#5a2a1c", 0.45)}
        </defs>
        {shadow(u, 100, 58)}
        {/* stivali */}
        <path d="M66 196 Q66 186 76 186 L92 186 Q96 198 92 210 L62 210 Q58 202 66 196 Z" fill={`url(#${u("leather")})`} />
        <path d="M108 186 L124 186 Q134 186 134 196 Q142 202 138 210 L108 210 Q104 198 108 186 Z" fill={`url(#${u("leather")})`} />
        <path d="M66 198 Q76 194 88 196" stroke="#a87a55" strokeWidth="1.5" fill="none" opacity="0.6" />
        {/* tunica di lana */}
        <path d="M56 196 Q54 150 72 138 Q100 128 128 138 Q146 150 144 196 Q100 204 56 196 Z" fill={`url(#${u("wool")})`} />
        {strands(7, (i) => `M${64 + i * 12} 150 Q${62 + i * 12} 172 ${66 + i * 12} 196`, "#24391a", 1.2, 0.35)}
        <path d="M58 180 Q100 188 142 180 L142 188 Q100 196 58 188 Z" fill={`url(#${u("leather")})`} />
        <rect x="92" y="178" width="16" height="13" rx="2.5" fill={`url(#${u("brass")})`} />
        <rect x="96" y="181.5" width="8" height="6" rx="1.5" fill="none" stroke="#6a4a14" strokeWidth="1.4" />
        {/* braccia e mani */}
        <path d="M60 146 Q44 160 46 184 Q52 188 58 184 Q58 166 68 156 Z" fill={`url(#${u("wool")})`} />
        <path d="M140 146 Q156 160 154 184 Q148 188 142 184 Q142 166 132 156 Z" fill={`url(#${u("wool")})`} />
        <ellipse cx="51" cy="188" rx="8.5" ry="7.5" fill={`url(#${u("skin")})`} />
        <ellipse cx="149" cy="188" rx="8.5" ry="7.5" fill={`url(#${u("skin")})`} />
        <path d="M46 190 q3 2 6 1 M47 186 q3 2 7 1" stroke="#b36f55" strokeWidth="0.9" fill="none" opacity="0.6" />
        <path d="M154 190 q-3 2 -6 1 M153 186 q-3 2 -7 1" stroke="#b36f55" strokeWidth="0.9" fill="none" opacity="0.6" />
        {/* orecchie */}
        <ellipse cx="64" cy="104" rx="7" ry="11" fill={`url(#${u("skin")})`} />
        <ellipse cx="136" cy="104" rx="7" ry="11" fill={`url(#${u("skin")})`} />
        <path d="M65 98 q-3 6 0 12" stroke="#b36f55" strokeWidth="1.4" fill="none" opacity="0.7" />
        <path d="M135 98 q3 6 0 12" stroke="#b36f55" strokeWidth="1.4" fill="none" opacity="0.7" />
        {/* viso */}
        <path d="M68 92 Q68 66 100 64 Q132 66 132 92 Q133 118 118 128 Q100 136 82 128 Q67 118 68 92 Z" fill={`url(#${u("skin")})`} />
        <ellipse cx="80" cy="110" rx="11" ry="8" fill={`url(#${u("cheek")})`} />
        <ellipse cx="120" cy="110" rx="11" ry="8" fill={`url(#${u("cheek")})`} />
        {/* rughe */}
        {strands(3, (i) => `M${84 + i * 2} ${80 + i * 3.5} Q100 ${77 + i * 3.5} ${116 - i * 2} ${80 + i * 3.5}`, "#a8644a", 0.9, 0.35)}
        <path d="M72 98 l-4 -2 M72 101 l-5 0 M128 98 l4 -2 M128 101 l5 0" stroke="#a8644a" strokeWidth="0.9" opacity="0.5" />
        <path d="M78 104 q8 3 15 0 M107 104 q8 3 15 0" stroke="#b9765b" strokeWidth="1" fill="none" opacity="0.45" />
        {eye(u, "l", { cx: 86, cy: 99, w: 15, h: 7, iris: "#7f9db3", irisDark: "#3c5568", lid: "#e6ad8e", tilt: -2 })}
        {eye(u, "r", { cx: 114, cy: 99, w: 15, h: 7, iris: "#7f9db3", irisDark: "#3c5568", lid: "#e6ad8e", tilt: 2 })}
        {/* sopracciglia folte */}
        {strands(9, (i, t) => `M${77 + t * 16} ${90 - Math.sin(t * 3.1) * 3} l${3 + t} -${2 + (1 - t) * 2}`, "#f4f1ea", 2.2, 0.95)}
        {strands(9, (i, t) => `M${123 - t * 16} ${90 - Math.sin(t * 3.1) * 3} l-${3 + t} -${2 + (1 - t) * 2}`, "#f4f1ea", 2.2, 0.95)}
        {/* barba */}
        <path d="M66 100 Q62 140 76 162 Q88 180 100 182 Q112 180 124 162 Q138 140 134 100 Q128 122 112 126 Q100 130 88 126 Q72 122 66 100 Z" fill={`url(#${u("beard")})`} />
        {strands(16, (i, t) => {
          const x = 70 + t * 60;
          return `M${x} ${112 + Math.abs(t - 0.5) * 8} Q${x + (t - 0.5) * 10} ${150} ${100 + (x - 100) * 0.55} ${174 - Math.abs(t - 0.5) * 22}`;
        }, "#a49d8f", 0.9, 0.5)}
        {strands(10, (i, t) => {
          const x = 76 + t * 48;
          return `M${x} ${118} Q${x + (t - 0.5) * 6} ${146} ${100 + (x - 100) * 0.6} ${168 - Math.abs(t - 0.5) * 18}`;
        }, "#ffffff", 1.1, 0.7)}
      </>
    ),
    mouth: { cx: 100, cy: 130, rx: 7.5, max: 7, fill: "#4a1d16" },
    front: (
      <>
        <path d="M92 131 Q100 135 108 131" stroke="#6a2a1e" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        {/* baffi */}
        <path d="M100 118 Q90 112 78 117 Q70 124 72 130 Q82 126 90 128 Q96 128 100 124 Q104 128 110 128 Q118 126 128 130 Q130 124 122 117 Q110 112 100 118 Z" fill={`url(#${u("beard")})`} />
        {strands(6, (i, t) => `M${98 - t * 2} ${120} Q${88 - t * 6} ${119 + t * 3} ${76 + t * 2} ${126 + t}`, "#a49d8f", 0.9, 0.55)}
        {strands(6, (i, t) => `M${102 + t * 2} ${120} Q${112 + t * 6} ${119 + t * 3} ${124 - t * 2} ${126 + t}`, "#a49d8f", 0.9, 0.55)}
        {/* naso */}
        <path d="M100 98 Q92 104 91 112 Q91 121 100 121 Q109 121 109 112 Q108 104 100 98 Z" fill={`url(#${u("nose")})`} />
        <ellipse cx="96" cy="108" rx="2.6" ry="3.5" fill="#fff" opacity="0.45" />
        <path d="M94 118 q2 2 4 1 M106 118 q-2 2 -4 1" stroke="#8d4a36" strokeWidth="1.2" fill="none" opacity="0.6" />
        {/* cappello di feltro */}
        <ellipse cx="100" cy="86" rx="40" ry="10" fill={`url(#${u("brim")})`} />
        <path d="M60 84 Q62 52 84 26 Q104 4 134 10 Q146 14 142 22 Q124 20 116 34 Q130 58 140 84 Q100 74 60 84 Z" fill={`url(#${u("hat")})`} />
        <path d="M84 72 Q92 46 110 30" stroke="#6f1d14" strokeWidth="2" fill="none" opacity="0.45" />
        <path d="M74 78 Q80 54 96 36" stroke="#e57a62" strokeWidth="2.2" fill="none" opacity="0.5" />
        <path d="M58 82 Q100 70 142 82 Q144 90 136 92 Q100 82 64 92 Q56 90 58 82 Z" fill="#8c2a1d" />
        <path d="M60 84 Q100 73 140 84" stroke="#c4553e" strokeWidth="1.5" fill="none" opacity="0.7" />
      </>
    ),
  };
}

function fagiolina(u: Ids): Art {
  return {
    body: (
      <>
        <defs>
          {rg(u("skin"), [[0, "#fbe2cf"], [0.65, "#f1c5a8"], [1, "#d69a7c"]], 0.38, 0.36, 0.72)}
          {soft(u("cheek"), "#ef8c7e", 0.5)}
          {lg(u("hair"), [[0, "#f08a48"], [0.5, "#d2602a"], [1, "#8e3a16"]])}
          {lg(u("dress"), [[0, "#8f66b8"], [0.5, "#6a4394"], [1, "#3f2560"]], 0, 0, 1, 0.5)}
          {lg(u("hat"), [[0, "#7e57a8"], [0.6, "#5a377f"], [1, "#2f1b47"]], 0, 0, 1, 0.3)}
          {lg(u("wood"), [[0, "#a87745"], [1, "#5e3c1e"]], 0, 0, 1, 0)}
          {lg(u("straw"), [[0, "#f2cc6a"], [1, "#b98a2c"]])}
          {lg(u("gold"), [[0, "#ffe08a"], [1, "#d39b1c"]])}
          {soft(u("brim"), "#2c1640", 0.5)}
        </defs>
        {shadow(u, 102, 56)}
        {/* scopa */}
        <path d="M140 108 L156 200" stroke={`url(#${u("wood")})`} strokeWidth="5.5" strokeLinecap="round" />
        <path d="M148 186 Q140 206 136 214 L174 214 Q168 204 162 184 Z" fill={`url(#${u("straw")})`} />
        {strands(8, (i, t) => `M${150 + t * 10} 188 L${138 + t * 34} 213`, "#9a7020", 0.9, 0.6)}
        <path d="M147 186 Q155 182 163 185" stroke="#7a4d22" strokeWidth="3" fill="none" />
        {/* vestito */}
        <path d="M58 210 Q62 158 78 142 Q100 134 122 142 Q138 158 142 210 Q100 216 58 210 Z" fill={`url(#${u("dress")})`} />
        {strands(5, (i, t) => `M${76 + t * 48} 152 Q${72 + t * 56} 182 ${66 + t * 68} 208`, "#2e1a48", 1.4, 0.35)}
        <path d="M84 148 Q100 160 116 148" stroke={`url(#${u("gold")})`} strokeWidth="2.5" fill="none" />
        <circle cx="100" cy="164" r="3" fill={`url(#${u("gold")})`} />
        {/* braccia */}
        <path d="M74 146 Q58 160 56 182 Q61 186 66 182 Q68 166 82 156 Z" fill={`url(#${u("dress")})`} />
        <path d="M126 146 Q140 154 144 168 Q140 174 134 170 Q130 160 120 156 Z" fill={`url(#${u("dress")})`} />
        <ellipse cx="61" cy="186" rx="7" ry="6.5" fill={`url(#${u("skin")})`} />
        <ellipse cx="143" cy="170" rx="7" ry="6.5" fill={`url(#${u("skin")})`} />
        {/* trecce */}
        {[-1, 1].map((s) => (
          <g key={s}>
            <path d={`M${100 + s * 30} 96 Q${100 + s * 46} 124 ${100 + s * 40} 152`} stroke={`url(#${u("hair")})`} strokeWidth="13" strokeLinecap="round" fill="none" />
            {strands(6, (i) => `M${100 + s * (32 + (i % 2) * 6)} ${102 + i * 8} q${s * 6} 4 ${s * 2} 9`, "#7d3010", 1.3, 0.55)}
            <path d={`M${100 + s * 40} 150 l${s * -3} 10 M${100 + s * 40} 150 l${s * 2} 11 M${100 + s * 40} 150 l${s * 6} 8`} stroke="#c45a26" strokeWidth="2" strokeLinecap="round" />
            <ellipse cx={100 + s * 40} cy="150" rx="5" ry="3" fill="#7fa04e" />
          </g>
        ))}
        {/* viso */}
        <path d="M70 100 Q70 72 100 70 Q130 72 130 100 Q130 124 116 133 Q100 140 84 133 Q70 124 70 100 Z" fill={`url(#${u("skin")})`} />
        <ellipse cx="81" cy="114" rx="10" ry="7" fill={`url(#${u("cheek")})`} />
        <ellipse cx="119" cy="114" rx="10" ry="7" fill={`url(#${u("cheek")})`} />
        {[[78, 109], [83, 113], [76, 114], [86, 108], [80, 117], [122, 109], [117, 113], [124, 114], [114, 108], [120, 117], [97, 112], [103, 112]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.1" fill="#b8673f" opacity="0.6" />
        ))}
        {/* frangia */}
        <path d="M70 98 Q72 76 100 74 Q128 76 130 98 Q122 86 110 86 Q104 92 96 88 Q86 84 78 92 Q74 94 70 98 Z" fill={`url(#${u("hair")})`} />
        {strands(8, (i, t) => `M${74 + t * 52} ${80 + Math.abs(t - 0.5) * 6} q${(t - 0.5) * 6} 6 ${(t - 0.5) * 3} 12`, "#8e3a16", 1, 0.5)}
        {eye(u, "l", { cx: 88, cy: 104, w: 14, h: 7.5, iris: "#7aa35a", irisDark: "#38552a", lid: "#efbfa2", lashes: true, outer: "left", tilt: -2 })}
        {eye(u, "r", { cx: 112, cy: 104, w: 14, h: 7.5, iris: "#7aa35a", irisDark: "#38552a", lid: "#efbfa2", lashes: true, outer: "right", tilt: 2 })}
        <path d="M80 94 Q87 90 95 93" stroke="#a5481e" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M105 93 Q113 90 120 94" stroke="#a5481e" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M98 105 Q96 113 99 116 Q101 117 103 115" stroke="#c98063" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <ellipse cx="99" cy="110" rx="1.5" ry="2.5" fill="#fff" opacity="0.4" />
      </>
    ),
    mouth: { cx: 100, cy: 125, rx: 6.5, max: 6, fill: "#6a2028" },
    front: (
      <>
        <path d="M91 121 Q100 127.5 109 121" stroke="#b9545a" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M94 124.5 Q100 127 106 124.5" stroke="#e7a3a0" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.8" />
        <path d="M89.5 120 q-1.5 0 -2.5 -1.5 M110.5 120 q1.5 0 2.5 -1.5" stroke="#b9675a" strokeWidth="1" fill="none" opacity="0.6" />
        {/* cappello a punta, un po' floscio */}
        <ellipse cx="100" cy="84" rx="44" ry="11" fill={`url(#${u("brim")})`} />
        <ellipse cx="100" cy="80" rx="64" ry="13" fill="#4a2b6b" />
        <path d="M40 80 Q100 70 160 80" stroke="#8a64b4" strokeWidth="2" fill="none" opacity="0.6" />
        <path d="M70 80 Q74 44 92 22 Q104 6 124 12 Q132 16 128 22 Q114 20 110 34 Q120 56 130 80 Z" fill={`url(#${u("hat")})`} />
        <path d="M80 74 Q86 48 100 32" stroke="#a585cc" strokeWidth="2" fill="none" opacity="0.45" />
        <path d="M72 72 Q100 64 128 72 L129 79 Q100 71 71 79 Z" fill={`url(#${u("gold")})`} />
        <path d="M112 42 l2.5 5.5 6 .8 -4.4 4.2 1 6 -5.1 -2.8 -5.3 2.8 1 -6 -4.3 -4.2 6 -.8 Z" fill={`url(#${u("gold")})`} />
      </>
    ),
  };
}

function rimario(u: Ids): Art {
  return {
    body: (
      <>
        <defs>
          {rg(u("body"), [[0, "#a4795a"], [0.6, "#7c5639"], [1, "#4a3020"]], 0.38, 0.3, 0.8)}
          {rg(u("chest"), [[0, "#f0dcbc"], [0.7, "#d6b98f"], [1, "#a98a62"]], 0.45, 0.3, 0.7)}
          {rg(u("disc"), [[0, "#f7ead2"], [0.75, "#e3cca8"], [1, "#9c7b57"]], 0.5, 0.45, 0.55)}
          {lg(u("wing"), [[0, "#7a5539"], [1, "#3f2817"]])}
          {lg(u("beak"), [[0, "#f2c062"], [1, "#b47a1c"]])}
          {lg(u("scarf"), [[0, "#d1503b"], [1, "#8c2a1d"]])}
        </defs>
        {shadow(u, 100, 54)}
        {/* zampe */}
        {[84, 116].map((x) => (
          <g key={x}>
            {strands(3, (i) => `M${x} 196 q${(i - 1) * 4} 8 ${(i - 1) * 7} 13`, "#c99234", 4, 1)}
            {strands(3, (i) => `M${x} 196 q${(i - 1) * 4} 8 ${(i - 1) * 7} 13`, "#f0c46c", 1.2, 0.8)}
          </g>
        ))}
        {/* corpo */}
        <path d="M100 52 Q160 56 164 128 Q166 192 100 200 Q34 192 36 128 Q40 56 100 52 Z" fill={`url(#${u("body")})`} />
        <path d="M100 118 Q138 122 140 160 Q138 194 100 196 Q62 194 60 160 Q62 122 100 118 Z" fill={`url(#${u("chest")})`} />
        {Array.from({ length: 4 }, (_, r) =>
          Array.from({ length: 4 - (r === 3 ? 1 : 0) }, (_, c) => {
            const x = 76 + c * 16 + (r % 2) * 8 - (r === 3 ? -8 : 0);
            const y = 136 + r * 14;
            return (
              <g key={`${r}-${c}`}>
                <path d={`M${x - 6} ${y} q6 7 12 0`} stroke="#8a6b47" strokeWidth="1.6" fill="none" opacity="0.7" />
                <path d={`M${x} ${y + 3} l0 3`} stroke="#5e4429" strokeWidth="1.2" opacity="0.5" />
              </g>
            );
          }),
        )}
        {/* ali con penne */}
        <path d="M40 112 Q22 160 50 198 Q66 176 62 118 Z" fill={`url(#${u("wing")})`} />
        <path d="M160 112 Q178 160 150 198 Q134 176 138 118 Z" fill={`url(#${u("wing")})`} />
        {strands(5, (i, t) => `M${44 + t * 6} ${126 + t * 50} q10 -4 14 -12`, "#2a1a0e", 1.4, 0.5)}
        {strands(5, (i, t) => `M${156 - t * 6} ${126 + t * 50} q-10 -4 -14 -12`, "#2a1a0e", 1.4, 0.5)}
        {strands(4, (i, t) => `M${48 + t * 4} ${130 + t * 50} q8 -3 11 -9`, "#b48a63", 1, 0.5)}
        {/* penna d'oca */}
        <path d="M150 186 Q172 150 186 112 Q176 128 166 138 Q170 124 178 114 Q160 140 146 182 Z" fill="#faf7f0" />
        <path d="M148 184 L184 114" stroke="#b9b3a6" strokeWidth="1.2" />
        <path d="M150 186 L146 194" stroke="#3a2a1a" strokeWidth="2" strokeLinecap="round" />
        {/* ciuffi */}
        <path d="M52 76 Q44 50 50 30 Q64 48 80 62 Z" fill={`url(#${u("wing")})`} />
        <path d="M148 76 Q156 50 150 30 Q136 48 120 62 Z" fill={`url(#${u("wing")})`} />
        {strands(3, (i) => `M${54 + i * 3} ${70 - i * 2} L${52 + i * 2} ${40 + i * 4}`, "#c49870", 1, 0.5)}
        {strands(3, (i) => `M${146 - i * 3} ${70 - i * 2} L${148 - i * 2} ${40 + i * 4}`, "#c49870", 1, 0.5)}
        {/* dischi facciali */}
        <circle cx="76" cy="92" r="28" fill={`url(#${u("disc")})`} />
        <circle cx="124" cy="92" r="28" fill={`url(#${u("disc")})`} />
        {strands(14, (i) => {
          const a = (i / 14) * Math.PI * 2;
          return `M${76 + Math.cos(a) * 12} ${92 + Math.sin(a) * 12} L${76 + Math.cos(a) * 25} ${92 + Math.sin(a) * 25}`;
        }, "#b8976d", 0.8, 0.45)}
        {strands(14, (i) => {
          const a = (i / 14) * Math.PI * 2;
          return `M${124 + Math.cos(a) * 12} ${92 + Math.sin(a) * 12} L${124 + Math.cos(a) * 25} ${92 + Math.sin(a) * 25}`;
        }, "#b8976d", 0.8, 0.45)}
        {eye(u, "l", { cx: 76, cy: 92, w: 25, h: 19, iris: "#f2a83a", irisDark: "#9a5a10", lid: "#d9bf98", line: "#2a1a0e" })}
        {eye(u, "r", { cx: 124, cy: 92, w: 25, h: 19, iris: "#f2a83a", irisDark: "#9a5a10", lid: "#d9bf98", line: "#2a1a0e" })}
        {/* occhiali */}
        <circle cx="76" cy="90" r="20" fill="#cfe6f2" opacity="0.12" stroke="#3b2a1d" strokeWidth="3.5" />
        <circle cx="124" cy="90" r="20" fill="#cfe6f2" opacity="0.12" stroke="#3b2a1d" strokeWidth="3.5" />
        <path d="M62 80 q6 -6 14 -6" stroke="#fff" strokeWidth="2" opacity="0.5" fill="none" />
        <path d="M110 80 q6 -6 14 -6" stroke="#fff" strokeWidth="2" opacity="0.5" fill="none" />
        <path d="M96 88 Q100 84 104 88" stroke="#3b2a1d" strokeWidth="3.5" fill="none" />
        {/* sciarpa a maglia */}
        <path d="M56 130 Q100 148 144 130 L146 142 Q100 162 54 142 Z" fill={`url(#${u("scarf")})`} />
        {strands(12, (i, t) => `M${60 + t * 80} ${134 + Math.sin(t * Math.PI) * 10} l0 8`, "#6f1d14", 1, 0.45)}
        <path d="M126 140 Q132 160 128 176 L138 174 Q140 156 136 138 Z" fill={`url(#${u("scarf")})`} />
      </>
    ),
    mouth: { cx: 100, cy: 121, rx: 5.5, max: 7, fill: "#5a2a0c" },
    front: (
      <>
        <path d="M89 102 Q100 98 111 102 Q106 116 100 124 Q94 116 89 102 Z" fill={`url(#${u("beak")})`} />
        <path d="M93 104 Q99 102 104 104" stroke="#fff3cf" strokeWidth="1.4" fill="none" opacity="0.7" />
        <path d="M86 112 Q90 116 94 114 M114 112 Q110 116 106 114" stroke="#8a6b47" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.7" />
      </>
    ),
  };
}

function plin(u: Ids): Art {
  return {
    body: (
      <>
        <defs>
          {rg(u("water"), [[0, "#f2fbff"], [0.35, "#b4e2f6"], [0.75, "#5fb3df"], [1, "#2a76ad"]], 0.38, 0.3, 0.85)}
          {rg(u("inner"), [[0, "#ffffff", 0.7], [1, "#ffffff", 0]], 0.5, 0.5, 0.5)}
          {soft(u("cheek"), "#f49ab8", 0.45)}
          {soft(u("glow"), "#8fd6ff", 0.55)}
          {lg(u("hair"), [[0, "#9fdcf7"], [1, "#2f86c2"]])}
        </defs>
        <ellipse cx="100" cy="150" rx="88" ry="78" fill={`url(#${u("glow")})`} />
        <ellipse cx="100" cy="211" rx="46" ry="7" fill="#2f7de1" opacity="0.18" />
        {/* capelli d'acqua che scendono */}
        <path d="M60 120 Q38 140 44 170 Q50 158 58 152 Q52 172 60 190 Q66 160 72 140 Z" fill={`url(#${u("hair")})`} opacity="0.85" />
        <path d="M140 120 Q162 140 156 170 Q150 158 142 152 Q148 172 140 190 Q134 160 128 140 Z" fill={`url(#${u("hair")})`} opacity="0.85" />
        {/* corpo a goccia */}
        <path d="M100 26 Q154 96 154 146 Q154 204 100 204 Q46 204 46 146 Q46 96 100 26 Z" fill={`url(#${u("water")})`} opacity="0.96" />
        <path d="M100 26 Q154 96 154 146 Q154 204 100 204 Q46 204 46 146 Q46 96 100 26 Z" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
        {/* riflessi e caustiche */}
        <path d="M72 160 Q66 128 84 96" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.55" />
        <path d="M80 82 Q86 72 92 64" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7" />
        <path d="M64 184 Q100 196 136 184" stroke="#ffffff" strokeWidth="2" fill="none" opacity="0.35" />
        {strands(5, (i, t) => `M${70 + t * 60} ${176 + Math.sin(i) * 3} q6 -4 12 0 q6 4 12 0`, "#e9f8ff", 1.2, 0.35)}
        <ellipse cx="112" cy="168" rx="26" ry="18" fill={`url(#${u("inner")})`} />
        {/* corona di gocce */}
        {[78, 100, 122].map((x, i) => (
          <path key={x} d={`M${x} ${62 - (i === 1 ? 10 : 0)} q7 11 0 15 q-7 -4 0 -15 Z`} fill="#ffffff" opacity="0.9" stroke="#8fd0f2" strokeWidth="0.8" />
        ))}
        {/* viso */}
        <ellipse cx="80" cy="152" rx="9" ry="6" fill={`url(#${u("cheek")})`} />
        <ellipse cx="120" cy="152" rx="9" ry="6" fill={`url(#${u("cheek")})`} />
        {eye(u, "l", { cx: 86, cy: 138, w: 15, h: 9, iris: "#4f8fd6", irisDark: "#1f4d86", lid: "#9fd6f2", line: "#1d4f7a", tilt: -2 })}
        {eye(u, "r", { cx: 114, cy: 138, w: 15, h: 9, iris: "#4f8fd6", irisDark: "#1f4d86", lid: "#9fd6f2", line: "#1d4f7a", tilt: 2 })}
        <path d="M79 127 Q86 124 93 127 M107 127 Q114 124 121 127" stroke="#2c6c9e" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.7" />
        <path d="M99 144 Q98 150 100 152" stroke="#3a86bf" strokeWidth="1.3" fill="none" opacity="0.6" />
        {/* bollicine */}
        <circle className="ch-bubble" cx="160" cy="80" r="5" fill="#e9f8ff" fillOpacity="0.25" stroke="#bfe7fa" strokeWidth="1.5" />
        <circle className="ch-bubble ch-bubble-2" cx="40" cy="70" r="4" fill="#e9f8ff" fillOpacity="0.25" stroke="#bfe7fa" strokeWidth="1.5" />
      </>
    ),
    mouth: { cx: 100, cy: 161, rx: 5.5, max: 6, fill: "#1f4f7a" },
    front: <path d="M93 158 Q100 163 107 158" stroke="#2f6f9f" strokeWidth="1.5" fill="none" strokeLinecap="round" />,
  };
}

function sassolino(u: Ids): Art {
  return {
    body: (
      <>
        <defs>
          {rg(u("skin"), [[0, "#b9cb94"], [0.6, "#93ab6c"], [1, "#5f7442"]], 0.38, 0.35, 0.75)}
          {soft(u("spot"), "#6d8550", 0.5)}
          {soft(u("cheek"), "#d98a7a", 0.4)}
          {rg(u("ear"), [[0, "#e7b6ae"], [1, "#a77c74"]], 0.6, 0.5, 0.7)}
          {lg(u("helmet"), [[0, "#d65a3f"], [0.6, "#a8331f"], [1, "#6a1c10"]], 0, 0, 0.6, 1)}
          {lg(u("apron"), [[0, "#8a6447"], [1, "#4a3020"]])}
          {lg(u("shirt"), [[0, "#7f8f9c"], [1, "#4a5560"]])}
          {soft(u("lamp"), "#ffe9a0", 0.9)}
          {soft(u("lantern"), "#ffcf5a", 0.6)}
          {lg(u("metal"), [[0, "#5a4a3a"], [1, "#2a2018"]])}
        </defs>
        {shadow(u, 100, 52)}
        {/* piedi */}
        <ellipse cx="80" cy="204" rx="17" ry="8" fill={`url(#${u("skin")})`} />
        <ellipse cx="120" cy="204" rx="17" ry="8" fill={`url(#${u("skin")})`} />
        <path d="M68 204 q3 3 6 3 M76 206 q3 2 6 2 M124 206 q3 0 6 -2 M132 204 q3 0 5 -3" stroke="#4d5f35" strokeWidth="1" fill="none" />
        {/* corpo */}
        <path d="M62 196 Q58 148 100 140 Q142 148 138 196 Q100 204 62 196 Z" fill={`url(#${u("shirt")})`} />
        <path d="M72 158 Q100 152 128 158 L132 196 Q100 202 68 196 Z" fill={`url(#${u("apron")})`} />
        <path d="M78 172 h14 v10 h-14 Z" fill="#3a2414" opacity="0.5" />
        <path d="M78 172 h14" stroke="#c49a6c" strokeWidth="1" opacity="0.6" />
        {strands(2, (i) => `M${76 + i * 46} 158 L${84 + i * 30} 146`, "#3a2414", 2.5, 0.9)}
        {/* braccio con lanterna */}
        <path d="M66 156 Q52 168 54 186 Q60 190 64 186 Q64 172 74 164 Z" fill={`url(#${u("shirt")})`} />
        <ellipse cx="59" cy="188" rx="7" ry="6" fill={`url(#${u("skin")})`} />
        <path d="M134 156 Q148 162 150 176 Q146 180 140 178 Q140 168 128 164 Z" fill={`url(#${u("shirt")})`} />
        <ellipse cx="146" cy="178" rx="6.5" ry="6" fill={`url(#${u("skin")})`} />
        <circle className="ch-glow" cx="152" cy="196" r="20" fill={`url(#${u("lantern")})`} />
        <path d="M146 176 Q152 172 158 176 L158 184" stroke={`url(#${u("metal")})`} strokeWidth="2" fill="none" />
        <rect x="143" y="184" width="18" height="22" rx="3" fill="#ffd36a" opacity="0.9" />
        <rect x="143" y="184" width="18" height="22" rx="3" fill="none" stroke={`url(#${u("metal")})`} strokeWidth="2.5" />
        <path d="M152 184 v22 M143 195 h18" stroke="#2a2018" strokeWidth="1.2" opacity="0.6" />
        <ellipse cx="152" cy="196" rx="3" ry="5" fill="#fff6d0" />
        {/* orecchie a punta */}
        <path d="M62 96 Q30 74 8 70 Q30 98 56 120 Z" fill={`url(#${u("skin")})`} />
        <path d="M138 96 Q170 74 192 70 Q170 98 144 120 Z" fill={`url(#${u("skin")})`} />
        <path d="M58 100 Q36 84 20 78 Q38 98 56 112 Z" fill={`url(#${u("ear")})`} />
        <path d="M142 100 Q164 84 180 78 Q162 98 144 112 Z" fill={`url(#${u("ear")})`} />
        <path d="M50 98 Q38 90 28 84 M150 98 Q162 90 172 84" stroke="#a0574f" strokeWidth="0.8" opacity="0.5" fill="none" />
        {/* testa */}
        <path d="M58 104 Q56 66 100 62 Q144 66 142 104 Q144 136 120 146 Q100 152 80 146 Q56 136 58 104 Z" fill={`url(#${u("skin")})`} />
        {[[72, 118, 6], [128, 120, 5], [116, 136, 4], [84, 138, 4]].map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={`url(#${u("spot")})`} />
        ))}
        <ellipse cx="74" cy="124" rx="9" ry="6" fill={`url(#${u("cheek")})`} />
        <ellipse cx="126" cy="124" rx="9" ry="6" fill={`url(#${u("cheek")})`} />
        {eye(u, "l", { cx: 84, cy: 108, w: 17, h: 9.5, iris: "#e2a23a", irisDark: "#8a5310", lid: "#a6bb7e", line: "#33401f", tilt: -2 })}
        {eye(u, "r", { cx: 116, cy: 108, w: 17, h: 9.5, iris: "#e2a23a", irisDark: "#8a5310", lid: "#a6bb7e", line: "#33401f", tilt: 2 })}
        {/* sopracciglia: alte e un po' preoccupate, non arrabbiate */}
        <path d="M74 96 Q82 90 92 93" stroke="#4d5f35" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M126 96 Q118 90 108 93" stroke="#4d5f35" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* elmetto da minatore */}
        <path d="M56 94 Q56 50 100 46 Q144 50 144 94 Z" fill={`url(#${u("helmet")})`} />
        <path d="M66 86 Q68 58 92 52" stroke="#ef8a6c" strokeWidth="2.5" fill="none" opacity="0.5" />
        <path d="M50 92 Q100 84 150 92 Q152 99 146 100 Q100 92 54 100 Q48 99 50 92 Z" fill="#7a1f12" />
        <circle cx="100" cy="66" r="22" fill={`url(#${u("lamp")})`} />
        <circle cx="100" cy="66" r="9" fill="#fff8d8" stroke={`url(#${u("metal")})`} strokeWidth="3" />
      </>
    ),
    mouth: { cx: 100, cy: 134, rx: 10, max: 8, fill: "#3b1f17" },
    front: (
      <>
        {/* naso a patata */}
        <path d="M100 110 Q90 114 90 122 Q92 129 100 129 Q108 129 110 122 Q110 114 100 110 Z" fill="#8aa364" />
        <ellipse cx="96" cy="117" rx="2.5" ry="3" fill="#e5f0cf" opacity="0.6" />
        <path d="M94 126 q2 1 3 0 M103 126 q1 1 3 0" stroke="#4d5f35" strokeWidth="1" fill="none" />
        <path d="M87 129.5 Q100 137 113 129.5" stroke="#4d5f35" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <rect x="94.5" y="132.4" width="5" height="4.2" rx="1" fill="#fbf6e6" />
        <rect x="100.5" y="132.4" width="5" height="4.2" rx="1" fill="#fbf6e6" />
      </>
    ),
  };
}

const CANOPY: [number, number, number, string][] = [
  [34, 86, 24, "leafB"], [176, 96, 20, "leafB"], [120, 92, 20, "leafB"], [92, 84, 24, "leafB"],
  [58, 60, 34, "leafA"], [140, 66, 32, "leafA"], [32, 58, 20, "leafA"], [88, 40, 22, "leafA"],
  [164, 42, 18, "leafA"], [114, 52, 22, "leafA"], [70, 30, 16, "leafA"],
];

function querce(u: Ids): Art {
  const leaf = (x: number, y: number, r: number, grad: string, k: string) => <circle key={k} cx={x} cy={y} r={r} fill={`url(#${u(grad)})`} />;
  return {
    body: (
      <>
        <defs>
          {rg(u("leafA"), [[0, "#9ec46a"], [0.6, "#5f8a3a"], [1, "#2f4f1c"]], 0.35, 0.3, 0.8)}
          {rg(u("leafB"), [[0, "#86b05a"], [0.6, "#4e7630"], [1, "#253f16"]], 0.35, 0.3, 0.8)}
          {lg(u("bark"), [[0, "#8a6440"], [0.5, "#6a4a2c"], [1, "#3c2716"]], 0, 0, 1, 0)}
          {lg(u("bark2"), [[0, "#9a7450"], [0.5, "#78563a"], [1, "#46301c"]], 0, 0, 1, 0)}
          {soft(u("hollow"), "#2a1a0e", 0.55)}
          {soft(u("moss"), "#7fa04e", 0.8)}
          {soft(u("cheek"), "#c98a5a", 0.45)}
          {lg(u("acorn"), [[0, "#e0a85a"], [1, "#a0662a"]])}
        </defs>
        {shadow(u, 100, 92)}
        {/* tronco di Nonna Quercia */}
        <path d="M36 212 Q48 160 46 96 Q70 86 94 96 Q90 160 102 212 Z" fill={`url(#${u("bark")})`} />
        {strands(8, (i, t) => `M${48 + t * 44} 112 Q${44 + t * 46 + (i % 2 ? 3 : -3)} 160 ${42 + t * 54} 210`, "#2e1d0f", 1.6, 0.45)}
        {strands(5, (i, t) => `M${54 + t * 34} 116 Q${52 + t * 36} 150 ${50 + t * 40} 190`, "#b08a62", 1, 0.35)}
        <ellipse cx="52" cy="190" rx="12" ry="7" fill={`url(#${u("moss")})`} />
        {/* tronco del fratello */}
        <path d="M116 212 Q128 168 126 104 Q144 96 160 104 Q158 168 170 212 Z" fill={`url(#${u("bark2")})`} />
        {strands(6, (i, t) => `M${128 + t * 30} 124 Q${126 + t * 32 + (i % 2 ? 2 : -2)} 168 ${122 + t * 42} 210`, "#3a2614", 1.5, 0.45)}
        <ellipse cx="160" cy="200" rx="10" ry="6" fill={`url(#${u("moss")})`} />
        {/* rami */}
        <path d="M60 104 Q40 90 26 92 M84 102 Q100 84 112 80 M140 110 Q130 92 120 90 M150 110 Q166 92 180 94" stroke="#4a3018" strokeWidth="5" strokeLinecap="round" fill="none" />
        {/* chiome: tanti ciuffi di foglie, chiari in alto a sinistra e scuri in basso */}
        {CANOPY.map(([x, y, r, g], i) => leaf(x, y, r, g, `c${i}`))}
        {Array.from({ length: 90 }, (_, i) => {
          const x = 14 + ((i * 41) % 176);
          const y = 22 + ((i * 29) % 88);
          // solo dentro la chioma, a qualche pixel dal bordo
          if (!CANOPY.some(([cx, cy, r]) => (x - cx) ** 2 + (y - cy) ** 2 < (r - 4) ** 2)) return null;
          const light = y < 60 && x < 130;
          return (
            <ellipse
              key={`l${i}`}
              cx={x}
              cy={y}
              rx="4.2"
              ry="2.2"
              transform={`rotate(${(i * 47) % 180} ${x} ${y})`}
              fill={light ? "#b7d67e" : "#2f4f1c"}
              opacity={light ? 0.55 : 0.35}
            />
          );
        })}
        {/* ghiande */}
        {[[40, 70], [86, 56], [150, 62], [172, 94], [118, 98]].map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <ellipse cx={x} cy={y + 6} rx="4.5" ry="6.5" fill={`url(#${u("acorn")})`} />
            <ellipse cx={x - 1.5} cy={y + 4.5} rx="1.2" ry="2" fill="#fff" opacity="0.4" />
            <path d={`M${x - 5.5} ${y + 2} Q${x} ${y - 4.5} ${x + 5.5} ${y + 2} Q${x} ${y + 4} ${x - 5.5} ${y + 2} Z`} fill="#6a4a28" />
            <path d={`M${x} ${y - 2} l1 -3`} stroke="#4a3018" strokeWidth="1.2" />
          </g>
        ))}
        {/* viso della nonna nella corteccia */}
        <ellipse cx="62" cy="146" rx="10" ry="8" fill={`url(#${u("hollow")})`} />
        <ellipse cx="82" cy="146" rx="10" ry="8" fill={`url(#${u("hollow")})`} />
        {eye(u, "l", { cx: 62, cy: 147, w: 12, h: 6.5, iris: "#8a6a3a", irisDark: "#4a3418", lid: "#6f4e30", line: "#2a1a0e", tilt: -2 })}
        {eye(u, "r", { cx: 82, cy: 147, w: 12, h: 6.5, iris: "#8a6a3a", irisDark: "#4a3418", lid: "#6f4e30", line: "#2a1a0e", tilt: 2 })}
        <path d="M53 136 Q61 132 70 134 M74 134 Q83 132 91 136" stroke="#c9d6a8" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M56 152 l-4 2 M88 152 l4 2" stroke="#2e1d0f" strokeWidth="1" opacity="0.6" />
        <ellipse cx="56" cy="160" rx="7" ry="5" fill={`url(#${u("cheek")})`} />
        <ellipse cx="88" cy="160" rx="7" ry="5" fill={`url(#${u("cheek")})`} />
        <path d="M72 150 Q69 158 72 162 Q75 163 76 160" stroke="#3a2614" strokeWidth="1.4" fill="none" opacity="0.7" />
        {/* il fratello sonnecchia e sorride */}
        <path d="M132 154 Q137 158 142 154 M148 154 Q153 158 158 154" stroke="#2a1a0e" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path d="M138 168 Q145 173 152 168" stroke="#2a1a0e" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <text x="160" y="140" fontSize="9" fill="#2a1a0e" opacity="0.5" fontFamily="serif" className="ch-zzz">z</text>
      </>
    ),
    mouth: { cx: 72, cy: 170, rx: 7, max: 7, fill: "#24140a" },
    front: <path d="M62 166 Q72 173 82 166" stroke="#2a1a0e" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.85" />,
  };
}

const ART: Record<CharacterId, (u: Ids) => Art> = { bastiano, fagiolina, rimario, plin, sassolino, querce };

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
  const prefix = useId().replace(/[^a-zA-Z0-9]/g, "");
  const art = ART[id]((name) => `${prefix}-${id}-${name}`);
  const { mouth } = art;

  useEffect(() => {
    let raf = 0;
    let smooth = 0;
    const loop = () => {
      const target = talking ? Math.min(1, Math.max(0, levelRef?.current ?? 0)) : 0;
      smooth += (target - smooth) * 0.35;
      const el = mouthRef.current;
      if (el) {
        el.setAttribute("ry", String(1.2 + smooth * mouth.max));
        el.setAttribute("rx", String(mouth.rx * (1 - smooth * 0.2)));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [talking, levelRef, mouth.max, mouth.rx]);

  return (
    <svg viewBox="0 0 200 220" width={size} height={size * 1.1} className={`character-art ${talking ? "is-talking" : ""}`} role="img" aria-hidden>
      <g className="ch-bob">
        <g className="ch-breathe">
          {art.body}
          <ellipse ref={mouthRef} data-mouth cx={mouth.cx} cy={mouth.cy} rx={mouth.rx} ry="1.2" fill={mouth.fill ?? "#5a1f18"} />
          {art.front}
        </g>
      </g>
    </svg>
  );
}
