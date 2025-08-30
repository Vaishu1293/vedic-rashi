"use client";
import React, { useMemo } from "react";

export type Planet =
  | "Asc" | "Sun" | "Moon" | "Mars" | "Mercury" | "Jupiter"
  | "Venus" | "Saturn" | "Rahu" | "Ketu" | "Uranus" | "Neptune" | "Pluto";

export interface Placement {
  planet: Planet;
  sign: number;     // 0..11 (0 = Aries)
  deg?: number;     // 0..<30 (defaults 0)
  retro?: boolean;
}

interface Props {
  ascSign: number;
  placements: Placement[];
  size?: number;                 // px, default 560
  selectedPlanet?: Planet | null;
  highlightPlanets?: Planet[];   // show *all* aspects for these
}

export const P_COLOR: Record<Planet, string> = {
  Asc:"#22d3ee", Sun:"#f59e0b", Moon:"#a78bfa", Mars:"#ef4444", Mercury:"#10b981",
  Jupiter:"#fbbf24", Venus:"#ec4899", Saturn:"#60a5fa", Rahu:"#34d399", Ketu:"#93c5fd",
  Uranus:"#67e8f9", Neptune:"#a7f3d0", Pluto:"#fcd34d",
};

const P_LABEL: Record<Planet, string> = {
  Asc:"Asc", Sun:"Sun", Moon:"Moon", Mars:"Mar", Mercury:"Mer", Jupiter:"Jup",
  Venus:"Ven", Saturn:"Sat", Rahu:"Rahu", Ketu:"Ketu", Uranus:"Ura", Neptune:"Nep", Pluto:"Plu",
};

// Whole-sign drishti offsets
export const DRISHTI_OFFSETS: Partial<Record<Planet, number[]>> = {
  Sun:[6], Moon:[6], Mercury:[6], Venus:[6],
  Mars:[3,6,7], Jupiter:[4,6,8], Saturn:[2,6,9],
  Rahu:[], Ketu:[],
};

// Sign names (0 = Aries)
const SIGN_NAMES = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
];

// ---------- math helpers ----------
const clampDeg = (d?: number) => Math.max(0, Math.min(29.999, d ?? 0));

// place Asc sign at the 12 o’clock edge; each sign is 30°
function signStartAngle(sign: number, ascSign: number): number {
  // angle increases clockwise; -90° is 12 o’clock
  const houseIdx = (sign - ascSign + 12) % 12;
  return -90 + houseIdx * 30;
}

function polar(cx: number, cy: number, r: number, angleDegCW: number) {
  const rad = (Math.PI / 180) * angleDegCW;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// Ring sector (filled annulus slice) path from start→end (CW)
function ringSectorPath(
  cx: number, cy: number,
  rInner: number, rOuter: number,
  startDeg: number, endDeg: number
) {
  // normalize CW small sweep (<= 30° in our usage)
  let s = startDeg, e = endDeg;
  if (e < s) [s, e] = [e, s];
  const large = e - s > 180 ? 1 : 0;     // always 0 here, but safe
  const sweep = 1;                       // clockwise

  const pOuterStart = polar(cx, cy, rOuter, s);
  const pOuterEnd   = polar(cx, cy, rOuter, e);
  const pInnerEnd   = polar(cx, cy, rInner, e);
  const pInnerStart = polar(cx, cy, rInner, s);

  // Outer arc (CW), inner arc (CCW using sweep=0), close
  return [
    `M ${pOuterStart.x} ${pOuterStart.y}`,
    `A ${rOuter} ${rOuter} 0 ${large} ${sweep} ${pOuterEnd.x} ${pOuterEnd.y}`,
    `L ${pInnerEnd.x} ${pInnerEnd.y}`,
    `A ${rInner} ${rInner} 0 ${large} ${0} ${pInnerStart.x} ${pInnerStart.y}`,
    "Z",
  ].join(" ");
}

type Seg = {
  targetSign: number;
  startAngle: number;   // cw degrees (absolute on wheel)
  endAngle: number;     // cw degrees
  color: string;
  brightFirst15: boolean;
};

// Build two segments per aspect: (target deg→30) + (next 0→deg)
function makeSegmentsForPlanet(pl: Planet, placements: Placement[], ascSign: number): Seg[] {
  const src = placements.find(p => p.planet === pl);
  if (!src) return [];
  const deg = clampDeg(src.deg);
  const color = P_COLOR[pl];
  const offs = DRISHTI_OFFSETS[pl] ?? [];
  const out: Seg[] = [];

  for (const off of offs) {
    const tgt = (src.sign + off) % 12;
    const nxt = (tgt + 1) % 12;

    // target sign start/end (absolute wheel angles)
    const tgtStart = signStartAngle(tgt, ascSign);
    const tgtEnd   = tgtStart + 30;
    const segAStart = tgtStart + deg; // deg→30
    const segAEnd   = tgtEnd;

    out.push({
      targetSign: tgt,
      startAngle: segAStart,
      endAngle: segAEnd,
      color,
      brightFirst15: true,
    });

    if (deg > 0) {
      const nxtStart = signStartAngle(nxt, ascSign);
      const segBStart = nxtStart;            // 0→deg
      const segBEnd   = nxtStart + deg;
      out.push({
        targetSign: nxt,
        startAngle: segBStart,
        endAngle: segBEnd,
        color,
        brightFirst15: false,
      });
    }
  }
  return out;
}
// -----------------------------------

const CircularRashiChart: React.FC<Props> = ({
  ascSign,
  placements,
  size = 560,
  selectedPlanet = null,
  highlightPlanets = [],
}) => {
  const cx = size / 2;
  const cy = size / 2;

  // radii
  const rOuter = size * 0.46;    // wheel outer rim (house border)
  const rInner = size * 0.28;    // inner rim (labels area)
  // the *band* will be a filled annular region between these two
  const rBandInner = size * 0.33;
  const rBandOuter = size * 0.43;

  // planet groups by sign
  const bySign = useMemo(() => {
    const m = new Map<number, Placement[]>();
    placements.forEach(p => {
      const arr = m.get(p.sign) ?? [];
      arr.push(p);
      m.set(p.sign, arr);
    });
    return m;
  }, [placements]);

  // collect aspect segments to draw
  const segs = useMemo(() => {
    const planets = highlightPlanets.length
      ? highlightPlanets
      : (selectedPlanet ? [selectedPlanet] : []);
    const res: Seg[] = [];
    planets.forEach(pl => {
      makeSegmentsForPlanet(pl, placements, ascSign).forEach(s => res.push(s));
    });
    // draw faded under bright
    res.sort((a,b) => Number(a.brightFirst15) - Number(b.brightFirst15));
    return res;
  }, [highlightPlanets, selectedPlanet, placements, ascSign]);

  // house boundaries & degree ticks (drawn LAST to keep borders fixed on top)
  const ticks = useMemo(() => {
    const lines: { x1:number,y1:number,x2:number,y2:number, opacity:number }[] = [];
    for (let i=0; i<12; i++) {
      const a = signStartAngle(i, ascSign);
      const p1 = polar(cx, cy, rOuter, a);
      const p2 = polar(cx, cy, rInner, a);
      lines.push({ x1:p1.x, y1:p1.y, x2:p2.x, y2:p2.y, opacity:0.4 });
      // optional small degree ticks (each 5° inside each sign)
      for (let g=5; g<30; g+=5) {
        const ag = a + g;
        const ip = polar(cx, cy, rOuter, ag);
        const jp = polar(cx, cy, rOuter-10, ag);
        lines.push({ x1:ip.x, y1:ip.y, x2:jp.x, y2:jp.y, opacity:0.14 });
      }
    }
    // close the circle
    const pO1 = polar(cx, cy, rOuter, signStartAngle(0, ascSign)+360);
    const pO2 = polar(cx, cy, rInner, signStartAngle(0, ascSign)+360);
    lines.push({ x1:pO1.x, y1:pO1.y, x2:pO2.x, y2:pO2.y, opacity:0.4 });
    return lines;
  }, [ascSign, cx, cy, rOuter, rInner]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {/* BACKGROUND */}
        <defs>
          <radialGradient id="bgGrad" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#0b163b" />
            <stop offset="100%" stopColor="#0e1842" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={rOuter} fill="url(#bgGrad)" />

        {/* === ASPECT OVERLAYS (draw UNDER borders) === */}
        {segs.map((s, i) => {
          // Split the first 15° for target chunks only
          const fullSpan = s.endAngle - s.startAngle;
          const brightSpan = s.brightFirst15 ? Math.min(15, fullSpan) : 0;
          const brightEnd  = s.startAngle + brightSpan;

          const brightPath = s.brightFirst15 && brightSpan > 0
            ? ringSectorPath(cx, cy, rBandInner, rBandOuter, s.startAngle, brightEnd)
            : null;
          const fadePath = ringSectorPath(
            cx, cy, rBandInner, rBandOuter,
            s.brightFirst15 ? brightEnd : s.startAngle,
            s.endAngle
          );

          return (
            <g key={i} style={{ mixBlendMode: "screen" }}>
              {/* faded annular sector */}
              {fadePath && (
                <path d={fadePath} fill={s.color} opacity={0.22} />
              )}
              {/* bright annular sector (first 15°) */}
              {brightPath && (
                <path d={brightPath} fill={s.color} opacity={0.72} />
              )}
              {/* crisp band border */}
              <path
                d={ringSectorPath(cx, cy, rBandInner, rBandOuter, s.startAngle, s.endAngle)}
                fill="none"
                stroke={s.color}
                strokeWidth={1.5}
                opacity={0.9}
              />
            </g>
          );
        })}

        {/* SIGN NAMES (around the rim) */}
        {Array.from({length: 12}).map((_, signIdx) => {
          const mid = signStartAngle(signIdx, ascSign) + 15;
          const rp  = rOuter + 18;
          const tp  = polar(cx, cy, rp, mid);
          return (
            <text
              key={`sign-name-${signIdx}`}
              x={tp.x}
              y={tp.y}
              fill="rgba(255,255,255,0.85)"
              fontSize={12}
              fontWeight={600}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {SIGN_NAMES[signIdx]}
            </text>
          );
        })}

        {/* PLANETS + HOUSE NOS (inside) */}
        {Array.from({length:12}).map((_, sign) => {
          const mid = signStartAngle(sign, ascSign) + 15; // middle of sign
          const labelR = (rInner + rOuter) / 2;
          const p = polar(cx, cy, labelR, mid);
          const houseNo = ((sign - ascSign + 12) % 12) + 1;
          const plist = bySign.get(sign) ?? [];
          return (
            <g key={sign}>
              {/* house no */}
              <text
                x={p.x}
                y={p.y - 12}
                fill="rgba(255,255,255,.85)"
                fontSize={11}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                H {houseNo}
              </text>
              {/* planets stacked slightly inward */}
              {plist.length > 0 && (
                <g>
                  {plist.map((pl, idx) => {
                    const rp = labelR - 18 - idx*12;
                    const tp = polar(cx, cy, rp, mid);
                    return (
                      <text
                        key={`${sign}-${pl.planet}-${idx}`}
                        x={tp.x} y={tp.y}
                        fill={P_COLOR[pl.planet]}
                        fontSize={11}
                        fontWeight={600}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {P_LABEL[pl.planet]}{pl.retro ? " ℞" : ""}
                      </text>
                    );
                  })}
                </g>
              )}
            </g>
          );
        })}

        {/* === HOUSE BORDERS on TOP (fixed) === */}
        <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="rgba(147,197,253,.35)" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r={rInner} fill="none" stroke="rgba(147,197,253,.18)" strokeWidth="1" />
        {ticks.map((t,i)=>(
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="rgba(255,255,255,0.7)" strokeOpacity={t.opacity} />
        ))}
      </svg>
    </div>
  );
};

export default CircularRashiChart;
