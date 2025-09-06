"use client";

import React, { useMemo, useState } from "react";
import NatalChart from "./natalChart"; // adjust path if needed

type TabKey = "natal" | "bhava" | "transit" | "dasha";

const TABS: { key: TabKey; label: string }[] = [
  { key: "natal", label: "Natal Chart" },
  { key: "bhava", label: "Bhava Chart" },
  { key: "transit", label: "Transit Chart" },
  { key: "dasha", label: "Dasha Bukti" },
];

export default function Page() {
  // Birth details state
  const [name, setName] = useState("");
  const [date, setDate] = useState<string>("");   // yyyy-mm-dd
  const [time, setTime] = useState<string>("");   // HH:mm
  const [place, setPlace] = useState<string>(""); // free text (city)
  const [tz, setTz] = useState<string>("0");      // offset hours as string

  // Persisted details (e.g., on Calculate)
  const [savedDetails, setSavedDetails] = useState<{
    name: string;
    date: string;
    time: string;
    place: string;
    tz: string;
  } | null>(null);

  const [tab, setTab] = useState<TabKey>("natal");

  const handleUseNow = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");
    setDate(`${yyyy}-${mm}-${dd}`);
    setTime(`${hh}:${mi}`);
    // best effort timezone offset in hours
    const offsetMin = -now.getTimezoneOffset();
    const offsetHr = (offsetMin / 60).toFixed(1);
    setTz(offsetHr);
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedDetails({ name, date, time, place, tz });
    // TODO: wire these into your chart computations
  };

  const title = useMemo(() => {
    const who = savedDetails?.name?.trim() || "South Indian Rashi Chart — Aspect Overlay";
    return who;
  }, [savedDetails]);

  return (
    <main className="min-h-screen bg-[#0a0f2a] py-6">
      <div className="container mx-auto px-3 max-w-[1100px]">
        {/* Top: Birth details */}
        <div className="rounded-xl border border-white/10 bg-[#0c1233] text-white/90 p-4 mb-6">
          <form onSubmit={handleCalculate} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-3">
              <label className="block text-xs opacity-80 mb-1">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
                placeholder="e.g., Aadhya"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs opacity-80 mb-1">Date of Birth</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs opacity-80 mb-1">Time of Birth</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
                step={60}
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs opacity-80 mb-1">Place</label>
              <input
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
                placeholder="City, Country"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs opacity-80 mb-1">Time Zone (UTC±)</label>
              <input
                type="text"
                value={tz}
                onChange={(e) => setTz(e.target.value)}
                className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
                placeholder="+5.5"
              />
            </div>

            <div className="md:col-span-12 flex gap-2 mt-1">
              <button
                type="button"
                onClick={handleUseNow}
                className="px-3 py-2 text-xs rounded-md bg-white/10 hover:bg-white/20 border border-white/10 transition"
              >
                Use Now
              </button>
              <button
                type="submit"
                className="px-3 py-2 text-xs rounded-md bg-white text-black font-semibold"
              >
                Calculate
              </button>
              {savedDetails && (
                <span className="text-xs opacity-70 ml-auto">
                  Saved: {savedDetails.date} {savedDetails.time} • {savedDetails.place || "—"} (UTC{savedDetails.tz.startsWith("-") ? "" : "+"}{savedDetails.tz})
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Tabs */}
        <div className="rounded-xl border border-white/10 overflow-hidden">
          {/* Tab headers */}
          <div className="flex items-center gap-2 bg-[#0c1233] px-3 py-2">
            {TABS.map(({ key, label }) => (
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
            ))}
          </div>

          {/* Tab content */}
          <div className="bg-[#0c1233]">
            {tab === "natal" && (
              <div className="p-3 md:p-4">
                {/* Center chart nicely */}
                <div className="flex items-center justify-center">
                  <NatalChart title={title} />
                </div>
              </div>
            )}

            {tab === "bhava" && (
              <div className="p-6 text-white/90">
                <div className="rounded-lg border border-white/10 p-6 bg-[#0b163b]">
                  <h2 className="text-lg font-semibold mb-2">Bhava Chart</h2>
                  <p className="text-sm opacity-80">
                    Placeholder: render your Bhava chart here. You can reuse your chart component with house cusps or
                    integrate a calculation engine and pass computed cusps/placements.
                  </p>
                </div>
              </div>
            )}

            {tab === "transit" && (
              <div className="p-6 text-white/90">
                <div className="rounded-lg border border-white/10 p-6 bg-[#0b163b]">
                  <h2 className="text-lg font-semibold mb-2">Transit Chart</h2>
                  <p className="text-sm opacity-80">
                    Placeholder: show current transits against the natal wheel. Hook this up to your ephemeris and feed
                    positions into the same circular renderer with a different ring/legend.
                  </p>
                </div>
              </div>
            )}

            {tab === "dasha" && (
              <div className="p-6 text-white/90">
                <div className="rounded-lg border border-white/10 p-6 bg-[#0b163b]">
                  <h2 className="text-lg font-semibold mb-2">Dasha Bukti</h2>
                  <p className="text-sm opacity-80">
                    Placeholder: display Vimshottari (or other) dasha timelines with bukti/antara. Add a timeline list,
                    progress bar, and “today” pointer.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
