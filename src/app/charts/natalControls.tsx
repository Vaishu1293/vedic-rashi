"use client";
import React from "react";

type Props = {
  showAllAspects: boolean;
  setShowAllAspects: (updater: (v: boolean) => boolean) => void | ((v: boolean) => void);
  selected: string | null;
  setSelected: (updater: (v: string | null) => string | null) => void | ((v: string | null) => void);
  availableDrishtiPlanets: string[];
  P_COLOR: Record<string, string>;
};

const NatalControls: React.FC<Props> = ({
  showAllAspects,
  setShowAllAspects,
  selected,
  setSelected,
  availableDrishtiPlanets,
  P_COLOR,
}) => {
  return (
    <div className="px-3 py-3 border-b border-white/10 space-y-2 bg-[#0c1233]">
      {/* Row 1: Show aspects (left) + Clear (right) */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() =>
            typeof setShowAllAspects === "function"
              ? (setShowAllAspects as any)((v: boolean) => !v)
              : null
          }
          className={`px-3 py-1.5 rounded text-xs border ${
            showAllAspects
              ? "bg-white text-black border-transparent"
              : "bg-transparent text-white/80 border-white/20"
          }`}
        >
          {showAllAspects ? "Hide all aspects" : "Show all aspects"}
        </button>

        <button
          onClick={() =>
            typeof setSelected === "function" ? (setSelected as any)(() => null) : null
          }
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
              onClick={() => !showAllAspects && (setSelected as any)((cur: string | null) => (cur === p ? null : p))}
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
  );
};

export default NatalControls;
