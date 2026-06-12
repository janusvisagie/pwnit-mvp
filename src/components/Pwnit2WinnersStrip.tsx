"use client";

import { useEffect, useState } from "react";

type WinnerRow = { id: string; alias: string; score: number; title: string; when: string };

export default function Pwnit2WinnersStrip() {
  const [winners, setWinners] = useState<WinnerRow[]>([]);

  useEffect(() => {
    fetch("/api/pwnit-2/winners", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setWinners(Array.isArray(d?.winners) ? d.winners : []))
      .catch(() => setWinners([]));
  }, []);

  if (!winners.length) return null;

  return (
    <div className="rounded-[2rem] border border-[#e6ded9] bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Recent winners</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {winners.map((w) => (
          <span
            key={w.id}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-900"
          >
            <span aria-hidden>🏆</span>
            {w.alias}
            <span className="font-bold text-emerald-700">won {w.title}</span>
            <span className="text-emerald-600">· {w.score}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
