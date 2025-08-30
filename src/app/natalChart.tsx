"use client";
import React, { useEffect, useMemo, useState } from "react";
import CircularRashiChart, { Placement, DRISHTI_OFFSETS, P_COLOR } from "./circularRashiChart";

interface NatalChartProps { title: string; }

const ALL_DRISHTI_PLANETS = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu"] as const;

const NatalChart: React.FC<NatalChartProps> = ({ title }) => {
  const [ascSign] = useState<number>(4); // Leo
  const [placements, setPlacements] = useState<Placement[]>([
    { planet: "Asc", sign: 2 },
    { planet: "Sun", sign: 10, deg: 28 },  // Gemini 15° (for testing)
    { planet: "Moon", sign: 6, deg: 22 },
    { planet: "Mars", sign: 2, deg: 18 },
    { planet: "Mercury", sign: 10, deg: 22, retro: true },
    { planet: "Jupiter", sign: 5, deg: 18 },
    { planet: "Venus", sign: 11, deg: 26 },
    { planet: "Saturn", sign: 10, deg: 0, retro: true },
    { planet: "Rahu", sign: 7, deg: 22 },
    { planet: "Ketu", sign: 1, deg: 22 },
  ]);

  // (optional) one-time tiny shuffle like your demo
  useEffect(() => {
    setPlacements(prev => prev.map(p => ({
      ...p,
      sign: Math.random() < 0.0 ? ((p.sign + 1) % 12) : p.sign, // disabled randomness here
    })));
  }, []);

  const timestamp = useMemo(() => new Date().toLocaleString(), []);

  const [showAllAspects, setShowAllAspects] = useState<boolean>(false);
  const [selected, setSelected] = useState<typeof ALL_DRISHTI_PLANETS[number] | null>("Venus");

  const availableDrishtiPlanets = useMemo(
    () => ALL_DRISHTI_PLANETS.filter(pl =>
      placements.some(p => p.planet === pl) && (DRISHTI_OFFSETS)[pl]
    ),
    [placements]
  );

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 mx-auto max-w-[980px]">
      <div className="bg-[#172155] text-white/90 text-center text-sm md:text-base font-semibold py-2">
        {title} on {timestamp}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-3 bg-[#0c1233] border-b border-white/10">
        <button
          onClick={() => setShowAllAspects(v => !v)}
          className={`px-3 py-1.5 rounded text-xs border ${showAllAspects ? "bg-white text-black" : "bg-transparent text-white/80 border-white/20"}`}
        >
          {showAllAspects ? "Hide all aspects" : "Show all aspects"}
        </button>

        {!showAllAspects && (
          <>
            <span className="text-xs opacity-80 ml-2">or highlight:</span>
            {availableDrishtiPlanets.map(p => (
              <button
                key={p}
                onClick={() => setSelected(cur => cur === p ? null : p)}
                className={`px-2 py-1 rounded-full text-xs border transition active:scale-95 ${
                  selected === p ? "bg-white text-black" : "bg-transparent text-white/80 border-white/20"
                }`}
                style={{ borderColor: selected === p ? "transparent" : P_COLOR[p], color: selected === p ? undefined : P_COLOR[p] }}
              >
                {p}
              </button>
            ))}
            <button onClick={() => setSelected(null)} className="ml-auto px-2 py-1 rounded text-xs bg-white/10 hover:bg-white/20">
              Clear
            </button>
          </>
        )}
      </div>

      {/* Chart */}
      <div className="p-3 md:p-4 bg-[#0c1233]">
        <CircularRashiChart
          ascSign={ascSign}
          placements={placements}
          size={560}
          selectedPlanet={showAllAspects ? null : selected}
          highlightPlanets={showAllAspects ? (availableDrishtiPlanets) : []}
          showAllAspects={showAllAspects}
        />
      </div>

      {/* Legend */}
      {showAllAspects && (
        <div className="px-3 py-2 text-xs flex flex-wrap items-center gap-3 border-t border-white/10 bg-[#0c1233]">
          <span className="opacity-80">Legend:</span>
          {availableDrishtiPlanets.map(p => (
            <span key={`legend-${p}`} className="inline-flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: P_COLOR[p] }} />
              {p}
            </span>
          ))}
          <span className="opacity-60 ml-auto">Bright = first 15° in target; faded = remainder/continuation into next sign.</span>
        </div>
      )}
    </div>
  );
};

export default NatalChart;
