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
  ascSign: number;               // fallback if no Asc placement found
  placements: Placement[];
  size?: number;                 // px, default 560
  selectedPlanet?: Planet | null;
  highlightPlanets?: Planet[];   // show *all* aspects for these
  showAllAspects?: boolean;      // outline-only if true
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
  Sun:[6], Moon:[5, 6, 7], Mercury:[6], Venus:[6],
  Mars:[3,6,7], Jupiter:[4,6,8], Saturn:[2,6,9],
  Rahu:[], Ketu:[],
};

const SIGN_NAMES = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
];

// helpers
const clampDeg = (d?: number) => Math.max(0, Math.min(29.999, d ?? 0));

/** Angle for the *start* of a sign when H1 = ascSignEff is at 12 o’clock (-90°). */
function signStartAngle(sign: number, ascSignEff: number): number {
  const houseIdx = (sign - ascSignEff + 12) % 12;
  return -90 + houseIdx * 30;
}

function polar(cx: number, cy: number, r: number, angleDegCW: number) {
  const rad = (Math.PI / 180) * angleDegCW;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function ringSectorPath(
  cx: number, cy: number,
  rInner: number, rOuter: number,
  startDeg: number, endDeg: number
) {
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

// --- replace this function with the one below ---

function makeSegmentsForPlanet(pl: Planet, placements: Placement[], ascSignEff: number): Seg[] {
  const src = placements.find(p => p.planet === pl);
  if (!src) return [];

  const startDeg = clampDeg(src.deg);      // degree inside the *target* sign
  const color = P_COLOR[pl];
  const offs = DRISHTI_OFFSETS[pl] ?? [];

  // ⬅️ Moon spans 30°, everyone else 15°
  const TOTAL_SPAN = pl === "Moon" ? 30 : 15;

  const out: Seg[] = [];

  for (const off of offs) {
    const tgt = (src.sign + off) % 12;
    const nxt = (tgt + 1) % 12;

    const tgtStartAngle = signStartAngle(tgt, ascSignEff);
    const nxtStartAngle = signStartAngle(nxt, ascSignEff);

    // portion inside target sign
    const endDegInTarget = Math.min(30, startDeg + TOTAL_SPAN);
    const spanInTarget   = endDegInTarget - startDeg;                 // 0..TOTAL_SPAN
    const overflow       = Math.max(0, (startDeg + TOTAL_SPAN) - 30); // 0..TOTAL_SPAN

    // A) target sign: startDeg → min(startDeg + TOTAL_SPAN, 30)
    if (spanInTarget > 0) {
      out.push({
        targetSign: tgt,
        startAngle: tgtStartAngle + startDeg,
        endAngle:   tgtStartAngle + endDegInTarget,
        color,
        // renderer will make the first 15° of this chunk bright, rest faded
        brightFirst15: true,
      });
    }

    // B) continuation into next sign: 0 → overflow
    if (overflow > 0) {
      out.push({
        targetSign: nxt,
        startAngle: nxtStartAngle + 0,
        endAngle:   nxtStartAngle + overflow,
        color,
        // continuation is fade-only
        brightFirst15: false,
      });
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

  const rOuter = size * 0.46;       // outer house border
  const rInner = size * 0.28;       // inner house border
  const rBandInner = size * 0.33;   // aspect band inner radius
  const rBandOuter = size * 0.43;   // aspect band outer radius

  // ✅ Ascendant-effective sign (H1). Use Asc placement if present.
  const ascSignEff = useMemo(() => {
    const asc = placements.find(p => p.planet === "Asc");
    return asc ? asc.sign : ascSign;
  }, [placements, ascSign]);

  // group planets by sign (useful for small stacking in same sign/degree)
  const bySign = useMemo(() => {
    const m = new Map<number, Placement[]>();
    placements.forEach(p => {
      const arr = m.get(p.sign) ?? [];
      arr.push(p);
      m.set(p.sign, arr);
    });
    // sort by degree for nicer stacking
    m.forEach(arr => arr.sort((a,b) => clampDeg(a.deg) - clampDeg(b.deg)));
    return m;
  }, [placements]);

  // collect aspect segments to draw
  const segs = useMemo(() => {
    const planets = highlightPlanets.length ? highlightPlanets : (selectedPlanet ? [selectedPlanet] : []);
    const res: Seg[] = [];
    planets.forEach(pl => { makeSegmentsForPlanet(pl, placements, ascSignEff).forEach(s => res.push(s)); });
    return res;
  }, [highlightPlanets, selectedPlanet, placements, ascSignEff]);

  // ticks for house boundaries
  const ticks = useMemo(() => {
    const lines: Array<{x1:number,y1:number,x2:number,y2:number,opacity:number}> = [];
    for (let i=0; i<12; i++) {
      const a = signStartAngle(i, ascSignEff);
      const p1 = polar(cx, cy, rOuter, a);
      const p2 = polar(cx, cy, rInner, a);
      lines.push({ x1:p1.x, y1:p1.y, x2:p2.x, y2:p2.y, opacity:0.45 });
    }
    // closing tick
    const a0 = signStartAngle(0, ascSignEff)+360;
    const p1 = polar(cx, cy, rOuter, a0);
    const p2 = polar(cx, cy, rInner, a0);
    lines.push({ x1:p1.x, y1:p1.y, x2:p2.x, y2:p2.y, opacity:0.45 });
    return lines;
  }, [ascSignEff, cx, cy, rOuter, rInner]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <radialGradient id="bgGrad" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#0b163b" />
            <stop offset="100%" stopColor="#0e1842" />
          </radialGradient>
        </defs>

        {/* Background */}
        <circle cx={cx} cy={cy} r={rOuter} fill="url(#bgGrad)" />

        {/* === Aspect bands UNDER borders === */}
        {segs.map((s, i) => {
          const fullPath = ringSectorPath(cx, cy, rBandInner, rBandOuter, s.startAngle, s.endAngle);
          if (showAllAspects) {
            return (
              <path
                key={i}
                d={fullPath}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                opacity={0.95}
              />
            );
          } else {
            const span = s.endAngle - s.startAngle;
            const brightSpan = s.brightFirst15 ? Math.min(15, span) : 0;
            const brightEnd  = s.startAngle + brightSpan;
            const brightPath = s.brightFirst15 && brightSpan > 0
              ? ringSectorPath(cx, cy, rBandInner, rBandOuter, s.startAngle, brightEnd)
              : null;
            const fadePath   = ringSectorPath(cx, cy, rBandInner, rBandOuter, s.brightFirst15 ? brightEnd : s.startAngle, s.endAngle);
            return (
              <g key={i} style={{ mixBlendMode: "screen" }}>
                {fadePath && <path d={fadePath} fill={s.color} opacity={0.22} />}
                {brightPath && <path d={brightPath} fill={s.color} opacity={0.72} />}
                <path d={fullPath} fill="none" stroke={s.color} strokeWidth={1.5} opacity={0.9} />
              </g>
            );
          }
        })}

        {/* Sign names around rim (absolute sign order) */}
        {Array.from({length:12}).map((_, signIdx) => {
          const mid = signStartAngle(signIdx, ascSignEff) + 15;
          const rp  = rOuter + 18;
          const tp  = polar(cx, cy, rp, mid);
          return (
            <text
              key={`sign-name-${signIdx}`}
              x={tp.x} y={tp.y}
              fill="rgba(255,255,255,0.85)"
              fontSize={12} fontWeight={600}
              textAnchor="middle" dominantBaseline="middle"
            >
              {SIGN_NAMES[signIdx]}
            </text>
          );
        })}

        {/* House numbers & planets (planets by degree) */}
        {Array.from({length:12}).map((_, sign) => {
          const mid = signStartAngle(sign, ascSignEff) + 15;
          const labelR = (rInner + rOuter) / 2;
          const p = polar(cx, cy, labelR, mid);
          const houseNo = ((sign - ascSignEff + 12) % 12) + 1; // ✅ H1 = Asc
          const plist = bySign.get(sign) ?? [];

          return (
            <g key={`house-${sign}`}>
              {/* House number */}
              <text
                x={p.x} y={p.y - 12}
                fill="rgba(255,255,255,.85)" fontSize={11}
                textAnchor="middle" dominantBaseline="middle"
              >
                H {houseNo}
              </text>

              {/* Planets at their *degree* within the sign */}
              {plist.map((pl, idx) => {
                const deg = clampDeg(pl.deg);
                const angle = signStartAngle(sign, ascSignEff) + deg;

                // slight radial staggering if multiple in same sign to avoid overlaps
                const baseR = labelR - 8;
                const rp = baseR - idx * 10;
                const tp = polar(cx, cy, rp, angle);

                const isAsc = pl.planet === "Asc";
                return (
                  <g key={`pl-${sign}-${pl.planet}-${idx}`}>
                    {/* ascendant marker line to rim */}
                    {isAsc && (
                      <line
                        x1={tp.x} y1={tp.y}
                        x2={polar(cx, cy, rOuter, angle).x}
                        y2={polar(cx, cy, rOuter, angle).y}
                        stroke={P_COLOR.Asc}
                        strokeOpacity={0.7}
                        strokeDasharray="2 3"
                      />
                    )}
                    <text
                      x={tp.x} y={tp.y}
                      fill={P_COLOR[pl.planet]}
                      fontSize={11} fontWeight={700}
                      textAnchor="middle" dominantBaseline="middle"
                    >
                      {P_LABEL[pl.planet]}{pl.retro ? " ℞" : ""}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Borders on top */}
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
