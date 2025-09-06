"use client";
import React, { useEffect, useMemo, useState } from "react";
import CircularRashiChart, { Placement, DRISHTI_OFFSETS, P_COLOR } from "./circularRashiChart";

interface NatalChartProps { title: string; }

const ALL_DRISHTI_PLANETS = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu"] as const;

const SIGN_NAMES = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
];

export default function NatalChart({ title }: NatalChartProps) {
  // fallback asc sign (used only if no Asc placement is provided)
  const [ascSign] = useState<number>(4); // Leo

  const [placements, setPlacements] = useState<Placement[]>([
    { planet: "Asc",     sign: 2,  deg: 10 }, // Gemini 10° → H1 = Gemini
    { planet: "Sun",     sign: 10, deg: 28 },
    { planet: "Moon",    sign: 6,  deg: 22 },
    { planet: "Mars",    sign: 2,  deg: 18 },
    { planet: "Mercury", sign: 10, deg: 22, retro: true },
    { planet: "Jupiter", sign: 5,  deg: 18 },
    { planet: "Venus",   sign: 11, deg: 26 },
    { planet: "Saturn",  sign: 10, deg: 0,  retro: true },
    { planet: "Rahu",    sign: 7,  deg: 22 },
    { planet: "Ketu",    sign: 1,  deg: 22 },
  ]);

  useEffect(() => { setPlacements(prev => prev); }, []);

  const timestamp = useMemo(() => new Date().toLocaleString(), []);

  const [showAllAspects, setShowAllAspects] = useState<boolean>(false);
  const [selected, setSelected] = useState<typeof ALL_DRISHTI_PLANETS[number] | null>("Venus");

  // Asc sign actually used for H1
  const ascSignEff = useMemo(() => {
    const asc = placements.find(p => p.planet === "Asc");
    return asc ? asc.sign : ascSign;
  }, [placements, ascSign]);

  const availableDrishtiPlanets = useMemo(
    () => ALL_DRISHTI_PLANETS.filter(pl =>
      placements.some(p => p.planet === pl) && (DRISHTI_OFFSETS)[pl]
    ),
    [placements]
  );

  const houseOf = (sign: number) => ((sign - ascSignEff + 12) % 12) + 1;

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 mx-auto max-w-[1200px]">
      <div className="bg-[#172155] text-white/90 text-center text-sm md:text-base font-semibold py-2">
        {title} on {timestamp}
      </div>

      {/* Two-column layout (stacks on small screens) */}
      <div className="bg-[#0c1233] grid grid-cols-1 md:grid-cols-12 gap-0">
        {/* LEFT: Controls + Chart */}
        <div className="md:col-span-7 border-b md:border-b-0 md:border-r border-white/10">

          {/* Controls (updated) */}
          <div className="px-3 py-3 border-b border-white/10 space-y-2 bg-[#0c1233]">
            {/* Row 1: Show aspects (left) + Clear (right) */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setShowAllAspects(v => !v)}
                className={`px-3 py-1.5 rounded text-xs border ${
                  showAllAspects
                    ? "bg-white text-black border-transparent"
                    : "bg-transparent text-white/80 border-white/20"
                }`}
              >
                {showAllAspects ? "Hide all aspects" : "Show all aspects"}
              </button>

              <button
                onClick={() => setSelected(null)}
                className="px-2 py-1 rounded text-xs bg-white/10 hover:bg-white/20 border border-white/10 transition"
              >
                Clear
              </button>
            </div>

            {/* Row 2: Individual planet highlight buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* <span className="text-xs opacity-80">Highlight planet:</span> */}
              {availableDrishtiPlanets.map((p) => {
                const isActive = selected === p && !showAllAspects;
                return (
                  <button
                    key={p}
                    onClick={() => !showAllAspects && setSelected(cur => cur === p ? null : p)}
                    className={`px-2 py-1 rounded-full text-xs border transition active:scale-95 ${
                      isActive
                        ? "bg-white text-black border-transparent"
                        : "bg-transparent text-white/80 border-white/20"
                    } ${showAllAspects ? "opacity-50 cursor-not-allowed" : ""}`}
                    style={{
                      borderColor: isActive || showAllAspects ? undefined : P_COLOR[p],
                      color: isActive || showAllAspects ? undefined : P_COLOR[p],
                    }}
                    aria-disabled={showAllAspects}
                    title={showAllAspects ? "Disabled while 'Show all aspects' is on" : `Highlight ${p}`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chart area */}
          <div className="p-3 md:p-4 flex items-center justify-center">
            <CircularRashiChart
              ascSign={ascSign}                         // fallback only; H1 comes from Asc placement
              placements={placements}
              size={560}
              selectedPlanet={showAllAspects ? null : selected}
              highlightPlanets={showAllAspects ? availableDrishtiPlanets : []}
              showAllAspects={showAllAspects}
            />
          </div>

          {/* Legend (only for show-all) */}
          {showAllAspects && (
            <div className="px-3 py-2 text-xs flex flex-wrap items-center gap-3 border-t border-white/10">
              <span className="opacity-80">Legend (outline-only):</span>
              {availableDrishtiPlanets.map(p => (
                <span key={`legend-${p}`} className="inline-flex items-center gap-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: P_COLOR[p] }} />
                  {p}
                </span>
              ))}
              <span className="opacity-60 ml-auto">
                In single-planet mode, the first 15° is bright; remainder fades (Moon spans 30°).
              </span>
            </div>
          )}
        </div>

        {/* RIGHT: Explanations / Details */}
        <div className="md:col-span-5">
          <div className="p-4 md:p-5 text-white/90">
            <div className="rounded-lg border border-white/10 p-4 bg-[#0b163b]">
              <h3 className="text-base font-semibold mb-3">Chart Details</h3>

              <div className="grid gap-4">
                {/* Houses & Asc */}
                <div className="rounded-md border border-white/10 p-3">
                  <div className="text-sm opacity-80 mb-2">
                    <span className="font-semibold">Ascendant</span>: {SIGN_NAMES[ascSignEff]} (H1)
                  </div>
                  <div className="text-xs opacity-80 mb-2">House mapping from Asc (H1):</div>
                  <ol className="text-xs space-y-1">
                    {Array.from({ length: 12 }).map((_, si) => (
                      <li key={si} className="flex items-center gap-2">
                        <span className="w-8 opacity-70">H{houseOf(si)}</span>
                        <span className="opacity-90">{SIGN_NAMES[si]}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Placements by degree/house */}
                <div className="rounded-md border border-white/10 p-3">
                  <div className="text-xs opacity-80 mb-2">Planetary placements (by degree & house):</div>
                  <ul className="text-xs space-y-1">
                    {placements.map((p, idx) => (
                      <li key={`${p.planet}-${idx}`} className="flex items-center gap-2">
                        <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: P_COLOR[p.planet] }} />
                        <span className="font-semibold" style={{ color: P_COLOR[p.planet] }}>{p.planet}</span>
                        <span className="opacity-85">{SIGN_NAMES[p.sign]}</span>
                        <span className="opacity-70">{(p.deg ?? 0).toFixed(1)}°</span>
                        <span className="opacity-70">• H{houseOf(p.sign)}</span>
                        {p.retro && <span className="opacity-70">℞</span>}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Rendering notes */}
                <div className="rounded-md border border-white/10 p-3 text-xs leading-relaxed">
                  <div className="font-semibold mb-1">How the aspect “vision band” is drawn</div>
                  <ul className="list-disc pl-5 space-y-1 opacity-90">
                    <li>
                      Aspects start at the same degree as the source planet in the target sign.
                      Default span is <b>15°</b>; for <b>Moon</b> it spans <b>30°</b>.
                    </li>
                    <li>
                      If the span crosses a sign boundary, it continues into the next sign seamlessly (overlay ignores house borders).
                    </li>
                    <li>
                      In single-planet mode, the first 15° within the span is brighter, then it fades; in “Show all aspects”
                      mode, bands are outlines with no fill to reduce visual clutter.
                    </li>
                  </ul>
                </div>

                {/* UI state summary */}
                <div className="text-[11px] opacity-70">
                  Mode: {showAllAspects ? "All aspects (outline only)" : (selected ? `Highlight: ${selected}` : "No highlight")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> {/* /grid */}
    </div>
  );
}
