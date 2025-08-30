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
  size?: number;                 
  selectedPlanet?: Planet | null;
  highlightPlanets?: Planet[];   
  showAllAspects?: boolean;      // NEW: control fill vs border mode
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

// Whole-sign drishti
export const DRISHTI_OFFSETS: Partial<Record<Planet, number[]>> = {
  Sun:[6], Moon:[6], Mercury:[6], Venus:[6],
  Mars:[3,6,7], Jupiter:[4,6,8], Saturn:[2,6,9],
  Rahu:[], Ketu:[],
};

const SIGN_NAMES = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
];

// helpers
const clampDeg = (d?: number) => Math.max(0, Math.min(29.999, d ?? 0));
function signStartAngle(sign: number, ascSign: number): number {
  const houseIdx = (sign - ascSign + 12) % 12;
  return -90 + houseIdx * 30;
}
function polar(cx: number, cy: number, r: number, angleDegCW: number) {
  const rad = (Math.PI / 180) * angleDegCW;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function ringSectorPath(cx: number, cy: number, rInner: number, rOuter: number, startDeg: number, endDeg: number) {
  let s = startDeg, e = endDeg;
  if (e < s) [s, e] = [e, s];
  const large = e - s > 180 ? 1 : 0;
  const sweep = 1;
  const pOuterStart = polar(cx, cy, rOuter, s);
  const pOuterEnd   = polar(cx, cy, rOuter, e);
  const pInnerEnd   = polar(cx, cy, rInner, e);
  const pInnerStart = polar(cx, cy, rInner, s);
  return [
    `M ${pOuterStart.x} ${pOuterStart.y}`,
    `A ${rOuter} ${rOuter} 0 ${large} ${sweep} ${pOuterEnd.x} ${pOuterEnd.y}`,
    `L ${pInnerEnd.x} ${pInnerEnd.y}`,
    `A ${rInner} ${rInner} 0 ${large} ${0} ${pInnerStart.x} ${pInnerStart.y}`,
    "Z",
  ].join(" ");
}

type Seg = { targetSign: number; startAngle: number; endAngle: number; color: string; brightFirst15: boolean };

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

    const tgtStart = signStartAngle(tgt, ascSign);
    const tgtEnd   = tgtStart + 30;
    const segAStart = tgtStart + deg; 
    const segAEnd   = tgtEnd;
    out.push({ targetSign: tgt, startAngle: segAStart, endAngle: segAEnd, color, brightFirst15: true });

    if (deg > 0) {
      const nxtStart = signStartAngle(nxt, ascSign);
      const segBStart = nxtStart;
      const segBEnd   = nxtStart + deg;
      out.push({ targetSign: nxt, startAngle: segBStart, endAngle: segBEnd, color, brightFirst15: false });
    }
  }
  return out;
}

const CircularRashiChart: React.FC<Props> = ({
  ascSign,
  placements,
  size = 560,
  selectedPlanet = null,
  highlightPlanets = [],
  showAllAspects = false,
}) => {
  const cx = size / 2;
  const cy = size / 2;

  const rOuter = size * 0.46;
  const rInner = size * 0.28;
  const rBandInner = size * 0.33;
  const rBandOuter = size * 0.43;

  const bySign = useMemo(() => {
    const m = new Map<number, Placement[]>();
    placements.forEach(p => {
      const arr = m.get(p.sign) ?? [];
      arr.push(p);
      m.set(p.sign, arr);
    });
    return m;
  }, [placements]);

  const segs = useMemo(() => {
    const planets = highlightPlanets.length ? highlightPlanets : (selectedPlanet ? [selectedPlanet] : []);
    const res: Seg[] = [];
    planets.forEach(pl => { makeSegmentsForPlanet(pl, placements, ascSign).forEach(s => res.push(s)); });
    return res;
  }, [highlightPlanets, selectedPlanet, placements, ascSign]);

  // ticks
  const ticks = useMemo(() => {
    const lines = [];
    for (let i=0; i<12; i++) {
      const a = signStartAngle(i, ascSign);
      const p1 = polar(cx, cy, rOuter, a);
      const p2 = polar(cx, cy, rInner, a);
      lines.push({ x1:p1.x, y1:p1.y, x2:p2.x, y2:p2.y, opacity:0.4 });
    }
    return lines;
  }, [ascSign, cx, cy, rOuter, rInner]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <radialGradient id="bgGrad" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#0b163b" />
            <stop offset="100%" stopColor="#0e1842" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={rOuter} fill="url(#bgGrad)" />

        {/* Aspect overlays */}
        {segs.map((s, i) => {
          const fullPath = ringSectorPath(cx, cy, rBandInner, rBandOuter, s.startAngle, s.endAngle);
          if (showAllAspects) {
            // outline only
            return <path key={i} d={fullPath} fill="none" stroke={s.color} strokeWidth={2} opacity={0.9} />;
          } else {
            // filled with bright/fade
            const fullSpan = s.endAngle - s.startAngle;
            const brightSpan = s.brightFirst15 ? Math.min(15, fullSpan) : 0;
            const brightEnd  = s.startAngle + brightSpan;
            const brightPath = s.brightFirst15 && brightSpan > 0
              ? ringSectorPath(cx, cy, rBandInner, rBandOuter, s.startAngle, brightEnd)
              : null;
            const fadePath = ringSectorPath(cx, cy, rBandInner, rBandOuter, s.brightFirst15 ? brightEnd : s.startAngle, s.endAngle);
            return (
              <g key={i} style={{ mixBlendMode:"screen" }}>
                {fadePath && <path d={fadePath} fill={s.color} opacity={0.22} />}
                {brightPath && <path d={brightPath} fill={s.color} opacity={0.72} />}
                <path d={fullPath} fill="none" stroke={s.color} strokeWidth={1.5} opacity={0.9} />
              </g>
            );
          }
        })}

        {/* Sign names */}
        {Array.from({length:12}).map((_, signIdx) => {
          const mid = signStartAngle(signIdx, ascSign) + 15;
          const rp  = rOuter + 18;
          const tp  = polar(cx, cy, rp, mid);
          return (
            <text key={signIdx} x={tp.x} y={tp.y} fill="white" fontSize={12} fontWeight={600} textAnchor="middle" dominantBaseline="middle">
              {SIGN_NAMES[signIdx]}
            </text>
          );
        })}

        {/* House numbers + planets */}
        {Array.from({length:12}).map((_, sign) => {
          const mid = signStartAngle(sign, ascSign) + 15;
          const labelR = (rInner + rOuter) / 2;
          const p = polar(cx, cy, labelR, mid);
          const houseNo = ((sign - ascSign + 12) % 12) + 1;
          const plist = bySign.get(sign) ?? [];
          return (
            <g key={sign}>
              <text x={p.x} y={p.y-12} fill="rgba(255,255,255,.85)" fontSize={11} textAnchor="middle" dominantBaseline="middle">
                H {houseNo}
              </text>
              {plist.map((pl, idx) => {
                const rp = labelR - 18 - idx*12;
                const tp = polar(cx, cy, rp, mid);
                return (
                  <text key={`${sign}-${pl.planet}-${idx}`} x={tp.x} y={tp.y} fill={P_COLOR[pl.planet]} fontSize={11} fontWeight={600} textAnchor="middle" dominantBaseline="middle">
                    {P_LABEL[pl.planet]}{pl.retro ? " ℞" : ""}
                  </text>
                );
              })}
            </g>
          );
        })}

        {/* Borders */}
        <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="rgba(147,197,253,.35)" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r={rInner} fill="none" stroke="rgba(147,197,253,.18)" strokeWidth="1" />
        {ticks.map((t,i)=>(<line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="rgba(255,255,255,0.7)" strokeOpacity={t.opacity} />))}
      </svg>
    </div>
  );
};

export default CircularRashiChart;
