"use client";
import React, { useMemo } from "react";
import { Placement, DRISHTI_OFFSETS } from "./circularRashiChart";

type Planet =
  | "Asc" | "Sun" | "Moon" | "Mars" | "Mercury" | "Jupiter"
  | "Venus" | "Saturn" | "Rahu" | "Ketu" | "Uranus" | "Neptune" | "Pluto";

type Props = {
  placements: Placement[];
  ascSignEff: number;     // H1 sign
  SIGN_NAMES: string[];
  P_COLOR: Record<string, string>;
};

const BENEFICS: Planet[] = ["Jupiter","Venus","Mercury","Moon"];
const MALEFICS: Planet[] = ["Sun","Mars","Saturn","Rahu","Ketu"];

const clampDeg = (d?: number) => Math.max(0, Math.min(29.999, d ?? 0));
const norm360 = (x: number) => ((x % 360) + 360) % 360;
const signStartAbs = (sign: number, ascEff: number) => ((sign - ascEff + 12) % 12) * 30; // 0..330

function absFromSignDeg(sign: number, deg: number, ascEff: number) {
  return signStartAbs(sign, ascEff) + deg; // 0..360 (deg<30)
}
function signFromAbs(absDeg: number, ascEff: number) {
  const a = norm360(absDeg);
  return Math.floor(a / 30); // 0..11 relative to ascEff=H1=0 sectoring
}
function degInSignFromAbs(absDeg: number) {
  const a = norm360(absDeg);
  return a % 30;
}

/* ---------- pretty format helpers ---------- */
const degFmt = (v: number) => `${v.toFixed(1)}°`;
const bandLabel = (signA: number, degA: number, signB: number, degB: number, SIGNS: string[]) =>
  `${degFmt(degA)} ${SIGNS[signA]} → ${degFmt(degB)} ${SIGNS[signB]}`;

/* ---------- simple conjunctions (same sign) ---------- */
function findConjunctions(placements: Placement[], orb = 8) {
  const out: Array<{ a: Placement; b: Placement; delta: number }> = [];
  const inSign = new Map<number, Placement[]>();
  placements.forEach(p => {
    const arr = inSign.get(p.sign) ?? [];
    arr.push(p);
    inSign.set(p.sign, arr);
  });
  inSign.forEach(list => {
    const sorted = [...list].sort((x,y)=>clampDeg(x.deg)-clampDeg(y.deg));
    for (let i=0;i<sorted.length;i++){
      for (let j=i+1;j<sorted.length;j++){
        const d = Math.abs(clampDeg(sorted[i].deg)-clampDeg(sorted[j].deg));
        if (d <= orb) out.push({ a: sorted[i], b: sorted[j], delta: d });
      }
    }
  });
  return out;
}

/* ---------- toy dignities & strengths ---------- */
const DIGNITY: Record<Exclude<Planet,"Asc"|"Rahu"|"Ketu"|"Uranus"|"Neptune"|"Pluto">, {
  exalt: number; debil: number; own: number[]; mool?: { sign: number };
}> = {
  Sun:     { exalt: 0,  debil: 6,  own: [4],      mool:{sign:4} },
  Moon:    { exalt: 1,  debil: 7,  own: [3] },
  Mars:    { exalt: 9,  debil: 3,  own: [0,7],   mool:{sign:0} },
  Mercury: { exalt: 5,  debil: 11, own: [2,5] },
  Jupiter: { exalt: 3,  debil: 9,  own: [8,11], mool:{sign:8} },
  Venus:   { exalt: 11, debil: 5,  own: [1,6],  mool:{sign:6} },
  Saturn:  { exalt: 6,  debil: 0,  own: [9,10], mool:{sign:10} },
};
function dignityInfo(p: Placement) {
  if (p.planet === "Asc" || p.planet === "Rahu" || p.planet === "Ketu") return { label: "—", score: 0 };
  const d = DIGNITY[p.planet as keyof typeof DIGNITY];
  if (!d) return { label: "—", score: 0 };
  if (p.sign === d.exalt) return { label: "Exalted", score: 3 };
  if (p.sign === d.debil) return { label: "Debilitated", score: -2 };
  if (d.own.includes(p.sign)) return { label: "Own sign", score: 2 };
  if (d.mool && p.sign === d.mool.sign) return { label: "Moolatrikona (approx.)", score: 2 };
  return { label: "Neutral", score: 0 };
}
function houseOf(sign: number, ascEff: number) { return ((sign - ascEff + 12) % 12) + 1; }
function dikBalaScore(planet: Planet, houseNo: number) {
  const best: Record<string, number> = { Sun:7, Saturn:7, Mars:10, Moon:4, Venus:4, Jupiter:1, Mercury:1 };
  const hBest = best[planet as string];
  if (!hBest) return 0;
  if (houseNo === hBest) return 2;
  if (houseNo === ((hBest+6-1)%12)+1) return 1;
  return 0;
}

/* ---------- combined bands (single line), with hits ---------- */
type CombinedBand = {
  src: Placement;
  startSign: number; startDeg: number;
  endSign: number;   endDeg: number;
  hit: Placement[];
};

function buildCombinedBandsWithHits(
  placements: Placement[],
  ascEff: number,
  DRISHTI: typeof DRISHTI_OFFSETS
): CombinedBand[] {
  const out: CombinedBand[] = [];

  for (const src of placements) {
    const offsets = DRISHTI[src.planet];
    if (!offsets) continue;

    const span = src.planet === "Moon" ? 30 : 15;     // special rule for Moon
    const srcDeg = clampDeg(src.deg);

    for (const off of offsets) {
      const targetSign = (src.sign + off) % 12;

      // Absolute (H1-based) start & end
      const startAbs = absFromSignDeg(targetSign, srcDeg, ascEff);      // could be up to ~360
      const endAbs   = startAbs + span;                                 // up to 390

      // Convert absolute end back to sign/deg (wrap ok)
      const endSign  = signFromAbs(endAbs, ascEff);
      const endDeg   = degInSignFromAbs(endAbs);

      // Collect hits between startAbs..endAbs, handling wrap across 360
      const hits: Placement[] = placements.filter(p => {
        if (p.planet === src.planet) return false;
        const pAbs0 = absFromSignDeg(p.sign, clampDeg(p.deg), ascEff); // 0..360
        if (endAbs <= 360) {
          // normal, no wrap
          return pAbs0 >= startAbs - 1e-6 && pAbs0 <= endAbs + 1e-6;
        } else {
          // wrapped: [startAbs..360] U [0..(endAbs-360)]
          return (pAbs0 >= startAbs - 1e-6 && pAbs0 <= 360 + 1e-6) ||
                 (pAbs0 >= 0 - 1e-6       && pAbs0 <= (endAbs - 360) + 1e-6);
        }
      });

      out.push({
        src,
        startSign: targetSign,
        startDeg: srcDeg,
        endSign,
        endDeg,
        hit: hits,
      });
    }
  }

  return out;
}

/* ---------- Drishti Bala & Chesta ---------- */
function drishtiBala(placements: Placement[], ascEff: number, DRISHTI: typeof DRISHTI_OFFSETS) {
  const bands = buildCombinedBandsWithHits(placements, ascEff, DRISHTI);
  const score = new Map<Planet, number>();
  placements.forEach(p => score.set(p.planet, 0));
  bands.forEach(b => {
    b.hit.forEach(target => {
      const s = score.get(target.planet) ?? 0;
      const isBen = BENEFICS.includes(b.src.planet);
      const isMal = MALEFICS.includes(b.src.planet);
      score.set(target.planet, s + (isBen ? 1 : 0) + (isMal ? -1 : 0));
    });
  });
  return score;
}
const chestaBala = (p: Placement) => (p.retro ? 2 : 0);

/* ===================== COMPONENT ===================== */
const InsightsPanel: React.FC<Props> = ({ placements, ascSignEff, SIGN_NAMES, P_COLOR }) => {
  // Single-line bands with wrap-safe hits
  const bands = useMemo(
    () => buildCombinedBandsWithHits(placements, ascSignEff, DRISHTI_OFFSETS),
    [placements, ascSignEff]
  );

  const conjunctions = useMemo(() => findConjunctions(placements, 8), [placements]);

  const strengthRows = useMemo(() => {
    const drishti = drishtiBala(placements, ascSignEff, DRISHTI_OFFSETS);
    return placements
      .filter(p => p.planet !== "Asc")
      .map(p => {
        const houseNo = houseOf(p.sign, ascSignEff);
        const dign = dignityInfo(p);
        const dik  = dikBalaScore(p.planet, houseNo);
        const dri  = drishti.get(p.planet) ?? 0;
        const che  = chestaBala(p);
        const total = dign.score + dik + dri + che;
        return { p, houseNo, dign, dik, dri, che, total };
      })
      .sort((a,b)=>b.total - a.total);
  }, [placements, ascSignEff]);

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-[#0c1233] text-white/90 overflow-hidden">
      <div className="px-4 py-2 bg-[#162055] font-semibold text-sm">Analytical Insights (Demo)</div>
      <div className="p-4 grid gap-6">

        {/* Aspect bands TABLE (single-line labels) */}
        <section className="rounded-lg border border-white/10 p-3">
          <h4 className="text-sm font-semibold mb-2">Aspect Bands & Targets</h4>
          <div className="text-[11px] opacity-75 mb-2">
            Bands start at the same degree in the target sign (15° span; Moon = 30°). Labels never split — e.g. <i>28.0° Leo → 13.0° Virgo</i>.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-white/80">
                <tr className="border-b border-white/10">
                  <th className="py-1 pr-2">Source</th>
                  <th className="py-1 pr-2">Band (single line)</th>
                  <th className="py-1 pr-2">Hits inside band</th>
                </tr>
              </thead>
              <tbody>
                {bands.length === 0 && (
                  <tr><td colSpan={3} className="py-2 opacity-70">No aspects found.</td></tr>
                )}
                {bands.map((b, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-1 pr-2">
                      <span className="font-semibold" style={{ color: P_COLOR[b.src.planet] }}>{b.src.planet}</span>
                      <span className="opacity-70"> @ {SIGN_NAMES[b.src.sign]} {degFmt(clampDeg(b.src.deg))}</span>
                    </td>
                    <td className="py-1 pr-2 whitespace-nowrap">
                      {bandLabel(b.startSign, b.startDeg, b.endSign, b.endDeg, SIGN_NAMES)}
                    </td>
                    <td className="py-1 pr-2">
                      {b.hit.length === 0 ? (
                        <span className="opacity-60">—</span>
                      ) : (
                        b.hit.map((h, j) => (
                          <span key={j} className="inline-flex items-center gap-1 mr-3">
                            <span className="w-2 h-2 rounded-full" style={{ background: P_COLOR[h.planet] }} />
                            <span>{h.planet}</span>
                            <span className="opacity-70">{SIGN_NAMES[h.sign]} {degFmt(clampDeg(h.deg))}</span>
                          </span>
                        ))
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Conjunctions TABLE */}
        <section className="rounded-lg border border-white/10 p-3">
          <h4 className="text-sm font-semibold mb-2">Conjunctions (≤ 8° orb, same sign)</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-white/80">
                <tr className="border-b border-white/10">
                  <th className="py-1 pr-2">Pair</th>
                  <th className="py-1 pr-2">Sign</th>
                  <th className="py-1 pr-2">Degrees</th>
                  <th className="py-1 pr-2">Δ°</th>
                </tr>
              </thead>
              <tbody>
                {conjunctions.length === 0 && (
                  <tr><td colSpan={4} className="py-2 opacity-70">No tight conjunctions detected.</td></tr>
                )}
                {conjunctions.map((c, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-1 pr-2">
                      <span className="font-semibold" style={{ color: P_COLOR[c.a.planet] }}>{c.a.planet}</span>
                      <span className="opacity-60"> × </span>
                      <span className="font-semibold" style={{ color: P_COLOR[c.b.planet] }}>{c.b.planet}</span>
                    </td>
                    <td className="py-1 pr-2">{SIGN_NAMES[c.a.sign]}</td>
                    <td className="py-1 pr-2">{degFmt(clampDeg(c.a.deg))} / {degFmt(clampDeg(c.b.deg))}</td>
                    <td className="py-1 pr-2">{c.delta.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Strengths TABLE (toy shadbala-like) */}
        <section className="rounded-lg border border-white/10 p-3">
          <h4 className="text-sm font-semibold mb-2">Planet Strength (Demo)</h4>
          <div className="text-[11px] opacity-75 mb-2">
            Dignity (+3 exalt / +2 own / -2 debil), Dik Bala (best house +2),
            Drishti Bala (benefic − malefic aspects), Chesta (+2 if retro).
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-white/80">
                <tr className="border-b border-white/10">
                  <th className="py-1 pr-2">Planet</th>
                  <th className="py-1 pr-2">Position</th>
                  <th className="py-1 pr-2">Dignity</th>
                  <th className="py-1 pr-2">Dik</th>
                  <th className="py-1 pr-2">Drishti</th>
                  <th className="py-1 pr-2">Chesta</th>
                  <th className="py-1 pr-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {strengthRows.map((row, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-1 pr-2 font-semibold" style={{ color: P_COLOR[row.p.planet] }}>
                      {row.p.planet}
                    </td>
                    <td className="py-1 pr-2">
                      {SIGN_NAMES[row.p.sign]} {degFmt(clampDeg(row.p.deg))} • H{row.houseNo}{row.p.retro ? " ℞" : ""}
                    </td>
                    <td className="py-1 pr-2">{row.dign.label} ({row.dign.score})</td>
                    <td className="py-1 pr-2">{row.dik}</td>
                    <td className="py-1 pr-2">{row.dri}</td>
                    <td className="py-1 pr-2">{row.che}</td>
                    <td className="py-1 pr-2 font-semibold">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
};

export default InsightsPanel;
