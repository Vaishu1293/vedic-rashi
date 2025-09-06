"use client";
import React, { useMemo } from "react";

export type Planet =
  | "Asc" | "Sun" | "Moon" | "Mars" | "Mercury" | "Jupiter"
  | "Venus" | "Saturn" | "Rahu" | "Ketu" | "Uranus" | "Neptune" | "Pluto";

export interface Placement {
  planet: Planet;
  sign: number;   // 0..11 (0 = Aries)
  deg?: number;   // 0.. <30 (degree inside the sign)
  retro?: boolean;
}

const P_LABEL: Record<Planet, string> = {
  Asc:"Asc", Sun:"Sun", Moon:"Moon", Mars:"Mar", Mercury:"Mer", Jupiter:"Jup",
  Venus:"Ven", Saturn:"Sat", Rahu:"Rahu", Ketu:"Ketu", Uranus:"Ura", Neptune:"Nep", Pluto:"Plu",
};

function houseOfSign(sign: number, ascSign: number): number {
  return ((sign - ascSign + 12) % 12) + 1;
}

const CELL_KEYS = [
  { key: "r2c1" }, // 0 Aries
  { key: "r1c1" }, // 1 Taurus
  { key: "r1c2" }, // 2 Gemini
  { key: "r1c3" }, // 3 Cancer
  { key: "r1c4" }, // 4 Leo
  { key: "r2c4" }, // 5 Virgo
  { key: "r3c4" }, // 6 Libra
  { key: "r4c4" }, // 7 Scorpio
  { key: "r4c3" }, // 8 Sagittarius
  { key: "r4c2" }, // 9 Capricorn
  { key: "r4c1" }, // 10 Aquarius
  { key: "r3c1" }, // 11 Pisces
];

interface SouthIndianProps {
  ascSign: number;
  placements: Placement[];
  showHouses?: boolean;
  className?: string;
  cellPx?: number;
  selectedPlanet?: Planet | null;
  highlightPlanets?: Planet[]; // show bands for all of these
}

// colors
export const P_COLOR: Record<Planet, string> = {
  Asc:"#22d3ee", Sun:"#f59e0b", Moon:"#a78bfa", Mars:"#ef4444", Mercury:"#10b981",
  Jupiter:"#fbbf24", Venus:"#ec4899", Saturn:"#60a5fa", Rahu:"#34d399", Ketu:"#93c5fd",
  Uranus:"#67e8f9", Neptune:"#a7f3d0", Pluto:"#fcd34d",
};

// whole-sign drishti
export const DRISHTI_OFFSETS: Partial<Record<Planet, number[]>> = {
  Sun:[6], Moon:[6], Mercury:[6], Venus:[6],
  Mars:[3,6,7], Jupiter:[4,6,8], Saturn:[2,6,9],
  Rahu:[4,6,8], Ketu:[4,6,8],
};

/* =========================
   DEGREE AXIS PER SIGN → how 0°→30° maps to arc angle inside the cell
   We draw a *semicircle* (180° sweep) inside each square cell.
   Map 0%..100% along the sign’s axis to the semicircle’s start..end angle.
   'lr' : 0% at left (180°), 100% at right (0°)
   'rl' : 0% at right (0°), 100% at left (180°)
   'tb' : 0% at top (270°), 100% at bottom (90°)
   'bt' : 0% at bottom (90°), 100% at top (270°)
   You asked: Sagittarius vertical; Capricorn vertical bottom→top.
*/
type Axis = "lr" | "rl" | "tb" | "bt";
const SIGN_AXIS: Record<number, Axis> = {
  0: "lr", // Aries
  1: "lr", // Taurus
  2: "lr", // Gemini
  3: "tb", // Cancer
  4: "tb", // Leo
  5: "rl", // Virgo
  6: "rl", // Libra
  7: "rl", // Scorpio
  8: "tb", // Sagittarius (vertical)
  9: "bt", // Capricorn (bottom→top)
 10: "bt", // Aquarius
 11: "lr", // Pisces
};

/* ------------ helpers ------------- */
const clampDeg = (d?: number) => Math.max(0, Math.min(29.999, d ?? 0));

function pctToAngle(axis: Axis, pct: number): number {
  // pct in 0..100 → angle in degrees on the semicircle
  const t = Math.max(0, Math.min(100, pct)) / 100;
  switch (axis) {
    case "lr": return 180 - 180 * t;         // 180 → 0
    case "rl": return 0 + 180 * t;           // 0 → 180
    case "tb": return 270 + 180 * t;         // 270 → 90
    case "bt": return 90 + 180 * (1 - t);    // 90 → 270
  }
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  // SVG arc path (outer arc only)
  const toRad = (d: number) => (d * Math.PI) / 180;
  const sx = cx + r * Math.cos(toRad(startDeg));
  const sy = cy + r * Math.sin(toRad(startDeg));
  const ex = cx + r * Math.cos(toRad(endDeg));
  const ey = cy + r * Math.sin(toRad(endDeg));
  let sweep = 0;
  let large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;

  // We always sweep in the direction from startDeg → endDeg
  // Adjust flags to match that direction (SVG uses 0/1 for sweep)
  sweep = endDeg > startDeg ? 1 : 0;

  return `M ${sx} ${sy} A ${r} ${r} 0 ${large} ${sweep} ${ex} ${ey}`;
}

type BandSeg = {
  sign: number;
  startPct: number;
  endPct: number;
  color: string;
  isTargetChunk: boolean; // deg..30 (true) vs 0..deg (false)
};

function makeBandsForPlanet(planet: Planet, all: Placement[]): BandSeg[] {
  const src = all.find(p => p.planet === planet);
  if (!src) return [];
  const deg = clampDeg(src.deg);
  const color = P_COLOR[planet];
  const offsets = DRISHTI_OFFSETS[planet] ?? [];
  const res: BandSeg[] = [];

  offsets.forEach(off => {
    const target = (src.sign + off) % 12;      // sign of the 30° chunk [deg..30]
    const next   = (target + 1) % 12;          // sign of the 30° chunk [0..deg]

    // target: deg → 30
    res.push({
      sign: target,
      startPct: (deg / 30) * 100,
      endPct: 100,
      color,
      isTargetChunk: true,
    });

    // next: 0 → deg
    if (deg > 0) {
      res.push({
        sign: next,
        startPct: 0,
        endPct: (deg / 30) * 100,
        color,
        isTargetChunk: false,
      });
    }
  });

  return res;
}
/* ---------------------------------- */

export default function SouthIndianChart({
  ascSign,
  placements,
  showHouses = true,
  className = "",
  cellPx = 80,
  selectedPlanet = null,
  highlightPlanets = [],
}: SouthIndianProps) {

  const bySign = useMemo(() => {
    const m = new Map<number, Placement[]>();
    placements.forEach(p => {
      const arr = m.get(p.sign) ?? [];
      arr.push(p);
      m.set(p.sign, arr);
    });
    return m;
  }, [placements]);

  // Build degree-anchored segments (two per aspect)
  const bandsBySign = useMemo(() => {
    const map = new Map<number, BandSeg[]>();
    const planets = highlightPlanets.length
      ? highlightPlanets
      : (selectedPlanet ? [selectedPlanet] : []);
    planets.forEach(pl => {
      makeBandsForPlanet(pl, placements).forEach(seg => {
        const list = map.get(seg.sign) ?? [];
        list.push(seg);
        map.set(seg.sign, list);
      });
    });
    return map;
  }, [highlightPlanets, selectedPlanet, placements]);

  // map for key→sign
  const signIndexMap = useMemo(() => {
    const m = new Map<string, number>();
    CELL_KEYS.forEach((v, idx) => m.set(v.key, idx));
    return m;
  }, []);

  const tdFor = (key: string) => renderSignCell(signIndexMap.get(key)!, key);

  const renderSignCell = (sign: number, tdKey: string) => {
    const planets = bySign.get(sign) ?? [];
    const isAscSign = sign === ascSign;
    const houseNo = houseOfSign(sign, ascSign);
    const axis = SIGN_AXIS[sign] ?? "lr";
    const bands = (bandsBySign.get(sign) ?? []).sort((a, b) => {
      // deterministic layering: faded chunks under bright
      if (a.isTargetChunk === b.isTargetChunk) return 0;
      return a.isTargetChunk ? 1 : -1;
    });

    return (
      <td key={tdKey} className="p-0 align-top" style={{ width: `${cellPx}px` }}>
        <div className="relative border border-blue-300/30 bg-[#0e1842] text-white" style={{ height: `${cellPx}px` }}>
          {/* SVG arc overlay */}
          <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Draw arcs for each band */}
            {bands.map((b, i) => {
              const startA = b.startPct;
              const endA   = b.endPct;

              // First 15° of the whole sign = 50% of the 0..100 axis
              // For target chunk (deg..30): bright = [startPct .. min(startPct+50, endPct)]
              // For next chunk (0..deg): only faded = [startPct .. endPct]
              const brightEnd = b.isTargetChunk ? Math.min(endA, startA + 50) : startA;

              // radii for two “in-circle” rings
              const rBright = 42;   // inner/first ring (brighter)
              const rFade   = 47;   // outer ring (fade continuation)

              const a0 = pctToAngle(axis, startA);
              const aB = pctToAngle(axis, brightEnd);
              const a1 = pctToAngle(axis, endA);

              // path helpers
              const brightPath = brightEnd > startA
                ? arcPath(50, 50, rBright, a0, aB)
                : null;
              const fadeStart  = b.isTargetChunk ? aB : a0;
              const fadePath   = endA > (b.isTargetChunk ? brightEnd : startA)
                ? arcPath(50, 50, rFade, fadeStart, a1)
                : null;

              return (
                <g key={i}>
                  {/* Faded continuation */}
                  {fadePath && (
                    <path
                      d={fadePath}
                      stroke={b.color}
                      strokeWidth={4}
                      strokeLinecap="round"
                      fill="none"
                      opacity={0.25}
                    />
                  )}
                  {/* Bright first 15° */}
                  {brightPath && (
                    <path
                      d={brightPath}
                      stroke={b.color}
                      strokeWidth={6}
                      strokeLinecap="round"
                      fill="none"
                      opacity={0.8}
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* House badge */}
          {showHouses && (
            <div className="absolute top-1 left-1 text-[10px] px-1 py-0.5 rounded bg-blue-300/15">
              H {houseNo}
            </div>
          )}

          {/* Asc mark */}
          {isAscSign && (
            <div className="absolute top-1 right-1 w-4 h-4 pointer-events-none">
              <div className="absolute left-1 top-0 h-[2px] w-3 bg-cyan-300/80 rotate-45" />
              <div className="absolute left-1 top-2 h-[2px] w-3 bg-cyan-300/80 rotate-45" />
            </div>
          )}

          {/* Planets labels */}
          <div className="absolute inset-0 flex items-center justify-center px-1">
            {planets.length === 0 ? (
              <span className="opacity-30 text-xs" />
            ) : (
              <div className="flex flex-col items-center gap-[2px] leading-none">
                {planets.map((p, i) => (
                  <span
                    key={`${sign}-${p.planet}-${i}`}
                    className="text-xs font-semibold"
                    style={{ color: P_COLOR[p.planet] }}
                  >
                    {P_LABEL[p.planet]}{p.retro ? " ℞" : ""}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </td>
    );
  };

  return (
    <div className={["rounded-xl overflow-hidden bg-[#0c1233] text-white shadow-lg", "mx-auto", className].join(" ")}>
      <div className="mx-auto" style={{ width: `calc(${cellPx}px * 4)`, maxWidth: "100%" }}>
        <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
          <tbody>
            <tr>{tdFor("r1c1")}{tdFor("r1c2")}{tdFor("r1c3")}{tdFor("r1c4")}</tr>
            <tr>
              {tdFor("r2c1")}
              <td className="p-0 align-top" rowSpan={2} colSpan={2}>
                <div className="border border-blue-300/30 bg-[#0b163b]" style={{ height: `calc(${cellPx}px * 2)` }} />
              </td>
              {tdFor("r2c4")}
            </tr>
            <tr>{tdFor("r3c1")}{tdFor("r3c4")}</tr>
            <tr>{tdFor("r4c1")}{tdFor("r4c2")}{tdFor("r4c3")}{tdFor("r4c4")}</tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
