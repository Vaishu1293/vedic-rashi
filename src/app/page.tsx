"use client";

import React from "react";
import NatalChart from "./natalChart"; // adjust path if you moved it

export default function Page() {
  return (
    <main className="min-h-screen bg-[#0a0f2a] py-6">
      <div className="container mx-auto px-3">
        <NatalChart title="South Indian Rashi Chart — Aspect Overlay" />
      </div>
    </main>
  );
}
