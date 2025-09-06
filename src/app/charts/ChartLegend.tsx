"use client";
import React from "react";

type Props = {
  show: boolean;
  availableDrishtiPlanets: string[];
  P_COLOR: Record<string, string>;
};

const ChartLegend: React.FC<Props> = ({ show, availableDrishtiPlanets, P_COLOR }) => {
  if (!show) return null;
  return (
    <div className="px-3 py-2 text-xs flex flex-wrap items-center gap-3 border-t border-white/10">
      <span className="opacity-80">Legend (outline-only):</span>
      {availableDrishtiPlanets.map((p) => (
        <span key={`legend-${p}`} className="inline-flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: P_COLOR[p] }} />
          {p}
        </span>
      ))}
      <span className="opacity-60 ml-auto">
        In single-planet mode, the first 15° is bright; remainder fades (Moon spans 30°).
      </span>
    </div>
  );
};

export default ChartLegend;
