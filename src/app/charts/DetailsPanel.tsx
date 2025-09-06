"use client";
import React from "react";
import type { Placement } from "./circularRashiChart";

type Props = {
  ascSignEff: number;
  placements: Placement[];
  SIGN_NAMES: string[];
  P_COLOR: Record<string, string>;
  houseOf: (sign: number) => number;
  uiSummary: string;
};

const DetailsPanel: React.FC<Props> = ({
  ascSignEff,
  placements,
  SIGN_NAMES,
  P_COLOR,
  houseOf,
  uiSummary,
}) => {
  return (
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

        {/* UI state summary */}
        <div className="text-[11px] opacity-70">
          Mode: {uiSummary}
        </div>
      </div>
    </div>
  );
};

export default DetailsPanel;
