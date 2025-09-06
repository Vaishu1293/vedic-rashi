"use client";

import React, { useMemo, useState } from "react";
import ChartTabs from "./ChartTabs";
import BirthDetailsForm, { BirthDetails } from "./BirthDetailsForm";


export default function Page() {
  const [saved, setSaved] = useState<BirthDetails | null>(null);

  const title = useMemo(
    () => saved?.name?.trim() || "South Indian Rashi Chart — Aspect Overlay",
    [saved]
  );

  return (
    <main className="min-h-screen bg-[#0a0f2a] py-6">
      <div className="container mx-auto px-3 max-w-[1100px]">
        <BirthDetailsForm
          initial={saved ?? undefined}
          onCalculate={(details) => setSaved(details)}
        />

        <ChartTabs title={title} />
      </div>
    </main>
  );
}
