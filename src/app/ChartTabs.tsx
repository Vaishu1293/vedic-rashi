"use client";

import React, { useState, useMemo } from "react";
import NatalChart from "./charts/natalChart";


type TabKey = "natal" | "bhava" | "transit" | "dasha";

const TABS: { key: TabKey; label: string }[] = [
  { key: "natal", label: "Natal Chart" },
  { key: "bhava", label: "Bhava Chart" },
  { key: "transit", label: "Transit Chart" },
  { key: "dasha", label: "Dasha Bukti" },
];

type Props = {
  title: string;
};

const Section: React.FC<React.PropsWithChildren<{ title: string }>> = ({ title, children }) => (
  <div className="p-6 text-white/90">
    <div className="rounded-lg border border-white/10 p-6 bg-[#0b163b]">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      {children}
    </div>
  </div>
);

export default function ChartTabs({ title }: Props) {
  const [tab, setTab] = useState<TabKey>("natal");

  const headers = useMemo(
    () =>
      TABS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setTab(key)}
          className={`px-3 py-2 text-sm rounded-md transition border ${
            tab === key
              ? "bg-white text-black border-transparent"
              : "text-white/85 bg-transparent border-white/10 hover:bg-white/10"
          }`}
        >
          {label}
        </button>
      )),
    [tab]
  );

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <div className="flex items-center gap-2 bg-[#0c1233] px-3 py-2">
        {headers}
      </div>

      <div className="bg-[#0c1233]">
        {tab === "natal" && (
          <div className="p-3 md:p-4">
            <div className="flex items-center justify-center">
              <NatalChart title={title} />
            </div>
          </div>
        )}

        {tab === "bhava" && (
          <Section title="Bhava Chart">
            <p className="text-sm opacity-80">
              Placeholder: render your Bhava chart here. Reuse the wheel/square with house cusps.
            </p>
          </Section>
        )}

        {tab === "transit" && (
          <Section title="Transit Chart">
            <p className="text-sm opacity-80">
              Placeholder: show current transits vs. natal. Feed positions into the circular renderer as a second ring.
            </p>
          </Section>
        )}

        {tab === "dasha" && (
          <Section title="Dasha Bukti">
            <p className="text-sm opacity-80">
              Placeholder: Vimshottari timeline with bukti/antara and a “today” pointer.
            </p>
          </Section>
        )}
      </div>
    </div>
  );
}
