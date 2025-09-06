"use client";
import React, { useEffect, useMemo, useState } from "react";
import CircularRashiChart, { Placement, DRISHTI_OFFSETS, P_COLOR } from "./circularRashiChart";
import NatalControls from "./natalControls";
import ChartLegend from "./ChartLegend";
import DetailsPanel from "./DetailsPanel";
import InsightsPanel from "./InsightsPanel";

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
          <NatalControls
            showAllAspects={showAllAspects}
            setShowAllAspects={setShowAllAspects}
            selected={selected}
            setSelected={setSelected}
            availableDrishtiPlanets={availableDrishtiPlanets as unknown as string[]}
            P_COLOR={P_COLOR}
          />

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

          <ChartLegend
            show={showAllAspects}
            availableDrishtiPlanets={availableDrishtiPlanets as unknown as string[]}
            P_COLOR={P_COLOR}
          />
        </div>

        {/* RIGHT: Explanations / Details */}
        <div className="md:col-span-5">
          <div className="p-4 md:p-5 text-white/90">
            <DetailsPanel
              ascSignEff={ascSignEff}
              placements={placements}
              SIGN_NAMES={SIGN_NAMES}
              P_COLOR={P_COLOR}
              houseOf={houseOf}
              uiSummary={showAllAspects ? "All aspects (outline only)" : (selected ? `Highlight: ${selected}` : "No highlight")}
            />
          </div>
        </div>

        {/* NEW: full-width analytical section */}
        <div className="md:col-span-12">
          <InsightsPanel
        placements={placements}
        ascSignEff={ascSignEff}
        SIGN_NAMES={SIGN_NAMES}
        P_COLOR={P_COLOR}
      />
        </div>
      
      </div> {/* /grid */}
    </div>
  );
}
