"use client";
import React, { useMemo } from "react";
// ⬇️ FIX: import DRISHTI_OFFSETS as a value, not a type
import { Placement, DRISHTI_OFFSETS } from "./circularRashiChart";

type Planet =
  | "Asc" | "Sun" | "Moon" | "Mars" | "Mercury" | "Jupiter"
  | "Venus" | "Saturn" | "Rahu" | "Ketu" | "Uranus" | "Neptune" | "Pluto";

type Props = {
  placements: Placement[];
  ascSignEff: number;                       // H1 sign
  SIGN_NAMES: string[];
  P_COLOR: Record<string, string>;
};

const BENEFICS: Planet[] = ["Jupiter","Venus","Mercury","Moon"];
const MALEFICS: Planet[] = ["Sun","Mars","Saturn","Rahu","Ketu"];

const clampDeg = (d?: number) => Math.max(0, Math.min(29.999, d ?? 0));
const signStart = (sign: number, ascEff: number) => ((sign - ascEff + 12) % 12) * 30; // degrees from H1=0°
const signOf = (absDeg: number) => Math.floor(((absDeg % 360) + 360) % 360 / 30);
const degInSign = (absDeg: number) => ((absDeg % 30) + 30) % 30;

/** Absolute wheel degrees (H1 = 0° at Asc sign start, clockwise) */
function absFromSignDeg(sign: number, deg: number, ascEff: number) {
  return signStart(sign, ascEff) + deg;
}

/** Simple conjunction detection: same sign & within orb degrees */
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

/** Dignity sets (very simplified) */
const DIGNITY: Record<Exclude<Planet,"Asc"|"Rahu"|"Ketu"|"Uranus"|"Neptune"|"Pluto">, {
  exalt: number; debil: number; own: number[]; mool?: { sign: number; start?: number; end?: number };
}> = {
  Sun:     { exalt: 0,  debil: 6,  own: [4],      mool:{sign:4} },          // Aries/Libra/Leo
  Moon:    { exalt: 1,  debil: 7,  own: [3] },                              // Taurus/Scorpio/Cancer
  Mars:    { exalt: 9,  debil: 3,  own: [0,7],   mool:{sign:0} },           // Cap/Cancer/Aries,Scorpio
  Mercury: { exalt: 5,  debil: 11, own: [2,5] },                            // Virgo/Pisces/Gemini,Virgo
  Jupiter: { exalt: 3,  debil: 9,  own: [8,11], mool:{sign:8} },            // Cancer/Cap/Sag,Pisces
  Venus:   { exalt: 11, debil: 5,  own: [1,6],  mool:{sign:6} },            // Pisces/Virgo/Taurus,Libra
  Saturn:  { exalt: 6,  debil: 0,  own: [9,10], mool:{sign:10} },           // Libra/Aries/Cap,Aqu
};

/** Map a placement to a dignity label and a small score (-2..+3 demo) */
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

/** Dik Bala (very simplified, by house) */
function houseOf(sign: number, ascEff: number) { return ((sign - ascEff + 12) % 12) + 1; }
function dikBalaScore(planet: Planet, houseNo: number) {
  // Classical: Sun/Saturn=H7, Mars=H10, Moon/Venus=H4, Jupiter/Mercury=H1
  const best: Record<string, number> = { Sun:7, Saturn:7, Mars:10, Moon:4, Venus:4, Jupiter:1, Mercury:1 };
  const hBest = best[planet as string];
  if (!hBest) return 0;
  if (houseNo === hBest) return 2;
  if (houseNo === ((hBest+6-1)%12)+1) return 1; // loose helper heuristic
  return 0;
}

/** Build aspect bands and find which placements fall inside them */
type Band = {
  src: Placement;
  targetStartSign: number;
  startDeg: number;   // within targetStartSign
  endSign: number;    // may equal start or next
  endDeg: number;     // degrees in endSign
  hit: Placement[];   // planets caught in this band
};

function buildBandsAndHits(
  placements: Placement[],
  ascEff: number,
  DRISHTI: typeof DRISHTI_OFFSETS
): Band[] {
  const out: Band[] = [];
  for (const src of placements) {
    if (!DRISHTI[src.planet]) continue;
    const span = src.planet === "Moon" ? 30 : 15;
    const startDeg = clampDeg(src.deg);
    for (const off of DRISHTI[src.planet]!) {
      const tgt = (src.sign + off) % 12;
      const nxt = (tgt + 1) % 12;

      const endDegInTarget = Math.min(30, startDeg + span);
      const spanInTarget   = endDegInTarget - startDeg;
      const overflow       = Math.max(0, (startDeg + span) - 30);

      const chunks: Band[] = [];
      if (spanInTarget > 0) {
        chunks.push({
          src,
          targetStartSign: tgt,
          startDeg: startDeg,
          endSign: tgt,
          endDeg: endDegInTarget,
          hit: [],
        });
      }
      if (overflow > 0) {
        chunks.push({
          src,
          targetStartSign: tgt,
          startDeg: 0,
          endSign: nxt,
          endDeg: overflow,
          hit: [],
        });
      }

      // fill hits
      for (const b of chunks) {
        const sAbs0 = absFromSignDeg(b.targetStartSign, b.startDeg, ascEff); // start (absolute)
        const eAbs0 = absFromSignDeg(b.endSign, b.endDeg, ascEff);           // end (absolute)
        const s = Math.min(sAbs0, eAbs0), e = Math.max(sAbs0, eAbs0);

        const hits = placements.filter(p => {
          if (p.planet === src.planet) return false;
          const pAbs = absFromSignDeg(p.sign, clampDeg(p.deg), ascEff);
          return pAbs >= s - 1e-6 && pAbs <= e + 1e-6;
        });
        b.hit = hits;
        out.push(b);
      }
    }
  }
  return out;
}

/** Drishti Bala (toy): +1 for each benefic aspect on planet, -1 per malefic */
function drishtiBala(placements: Placement[], ascEff: number, DRISHTI: typeof DRISHTI_OFFSETS) {
  const bands = buildBandsAndHits(placements, ascEff, DRISHTI);
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

/** Chesta Bala (very toy): +2 if retrograde, else 0  */
function chestaBala(p: Placement) { return p.retro ? 2 : 0; }

const InsightsPanel: React.FC<Props> = ({ placements, ascSignEff, SIGN_NAMES, P_COLOR }) => {
  // Aspect bands & hits
  const bands = useMemo(
    () => buildBandsAndHits(placements, ascSignEff, DRISHTI_OFFSETS),
    [placements, ascSignEff]
  );

  // Conjunctions
  const conjunctions = useMemo(() => findConjunctions(placements, 8), [placements]);

  // Strengths (demo)
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
        const total = dign.score + dik + dri + che; // demo total
        return { p, houseNo, dign, dik, dri, che, total };
      })
      .sort((a,b)=>b.total - a.total);
  }, [placements, ascSignEff]);

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-[#0c1233] text-white/90 overflow-hidden">
      <div className="px-4 py-2 bg-[#162055] font-semibold text-sm">Analytical Insights (Demo)</div>
      <div className="p-4 grid gap-6">
        {/* Aspect bands */}
        <section className="rounded-lg border border-white/10 p-3">
          <h4 className="text-sm font-semibold mb-2">Aspect Bands & Targets</h4>
          <div className="text-[11px] opacity-75 mb-2">
            Bands start at the same degree in the target sign (15° span; Moon = 30°). If needed, they overflow into the next sign.
          </div>
          <div className="space-y-2 text-xs">
            {bands.length === 0 && <div className="opacity-70">No aspects found.</div>}
            {bands.map((b, i) => {
              const startLabel = `${SIGN_NAMES[b.targetStartSign]} ${b.startDeg.toFixed(1)}°`;
              const endLabel   = `${SIGN_NAMES[b.endSign]} ${b.endDeg.toFixed(1)}°`;
              return (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold" style={{ color: P_COLOR[b.src.planet] }}>{b.src.planet}</span>
                  <span className="opacity-80">band:</span>
                  <span>{startLabel} → {endLabel}</span>
                  {b.hit.length > 0 ? (
                    <>
                      <span className="opacity-70">• hits:</span>
                      {b.hit.map((h, j) => (
                        <span key={j} className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ background: P_COLOR[h.planet] }} />
                          <span>{h.planet} ({SIGN_NAMES[h.sign]} {clampDeg(h.deg).toFixed(1)}°)</span>
                        </span>
                      ))}
                    </>
                  ) : (
                    <span className="opacity-60">• no planets inside</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Conjunctions */}
        <section className="rounded-lg border border-white/10 p-3">
          <h4 className="text-sm font-semibold mb-2">Conjunctions (≤ 8° orb, same sign)</h4>
          <div className="text-xs space-y-1">
            {conjunctions.length === 0 && <div className="opacity-70">No tight conjunctions detected.</div>}
            {conjunctions.map((c, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <span className="font-semibold" style={{ color: P_COLOR[c.a.planet] }}>{c.a.planet}</span>
                <span className="opacity-70">@ {SIGN_NAMES[c.a.sign]} {clampDeg(c.a.deg).toFixed(1)}°</span>
                <span>×</span>
                <span className="font-semibold" style={{ color: P_COLOR[c.b.planet] }}>{c.b.planet}</span>
                <span className="opacity-70">@ {SIGN_NAMES[c.b.sign]} {clampDeg(c.b.deg).toFixed(1)}°</span>
                <span className="opacity-80">Δ {c.delta.toFixed(1)}°</span>
              </div>
            ))}
          </div>
        </section>

        {/* Strengths (toy shadbala-like) */}
        <section className="rounded-lg border border-white/10 p-3">
          <h4 className="text-sm font-semibold mb-2">Planet Strength (Demo)</h4>
          <div className="text-[11px] opacity-75 mb-2">
            Simplified scores: Dignity (+3 exalt / +2 own / -2 debil), Dik Bala (best house +2),
            Drishti Bala (benefic aspects − malefic aspects), Chesta (+2 if retro).
          </div>
          <div className="space-y-1 text-xs">
            {strengthRows.map((row, i) => (
              <div key={i} className="flex flex-wrap items-center gap-3">
                <span className="font-semibold" style={{ color: P_COLOR[row.p.planet] }}>{row.p.planet}</span>
                <span className="opacity-75">{SIGN_NAMES[row.p.sign]} {(clampDeg(row.p.deg)).toFixed(1)}° • H{row.houseNo}</span>
                <span className="opacity-90">Dignity: {row.dign.label} ({row.dign.score})</span>
                <span className="opacity-90">Dik Bala: {row.dik}</span>
                <span className="opacity-90">Drishti: {row.dri}</span>
                <span className="opacity-90">Chesta: {row.che}</span>
                <span className="ml-auto font-semibold">Total: {row.total}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default InsightsPanel;
