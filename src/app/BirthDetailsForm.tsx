"use client";

import React, { useState } from "react";

export type BirthDetails = {
  name: string;
  date: string;   // yyyy-mm-dd
  time: string;   // HH:mm
  place: string;  // free text
  tz: string;     // e.g. "+5.5"
};

type Props = {
  initial?: Partial<BirthDetails>;
  onCalculate: (details: BirthDetails) => void;
};

export default function BirthDetailsForm({ initial, onCalculate }: Props) {
  const [name, setName]   = useState(initial?.name  ?? "");
  const [date, setDate]   = useState(initial?.date  ?? "");
  const [time, setTime]   = useState(initial?.time  ?? "");
  const [place, setPlace] = useState(initial?.place ?? "");
  const [tz, setTz]       = useState(initial?.tz    ?? "0");

  const handleUseNow = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");
    setDate(`${yyyy}-${mm}-${dd}`);
    setTime(`${hh}:${mi}`);
    const offsetMin = -now.getTimezoneOffset();
    setTz((offsetMin / 60).toFixed(1));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate({ name, date, time, place, tz });
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#0c1233] text-white/90 p-4 mb-6">
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
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
            step={60}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>

        <div className="md:col-span-3">
          <label className="block text-xs opacity-80 mb-1">Place</label>
          <input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="City, Country"
            className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs opacity-80 mb-1">Time Zone (UTC±)</label>
          <input
            type="text"
            value={tz}
            onChange={(e) => setTz(e.target.value)}
            placeholder="+5.5"
            className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
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
          {(date || time || place || tz) && (
            <span className="text-xs opacity-70 ml-auto">
              {date} {time} • {place || "—"} (UTC{tz.startsWith("-") ? "" : "+"}{tz})
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
