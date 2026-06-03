"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { pwnit2DemoCampaign, pwnit2Leaderboard, type Pwnit2LeaderboardEntry } from "@/lib/pwnit2DemoCampaign";

const STORAGE_KEY = "pwnit2-number-chain-best";

export default function Pwnit2Leaderboard() {
  const [localBest, setLocalBest] = useState<number | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed)) setLocalBest(parsed);
  }, []);

  const rows = useMemo(() => {
    const baseRows: Pwnit2LeaderboardEntry[] = [...pwnit2Leaderboard];
    if (localBest !== null) {
      baseRows.push({
        rank: 0,
        alias: "You",
        score: localBest,
        bestTime: "This device",
        attempts: 1,
        badge: "Personal best",
      });
    }

    return baseRows
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [localBest]);

  return (
    <main className="min-h-screen bg-[#fffaf8] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl space-y-5">
        <div className="rounded-[2rem] border border-[#f0d9d1] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#a64f3d]">{pwnit2DemoCampaign.title}</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Campaign leaderboard</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-700">
                The board ranks Number Chain Sprint scores by points. A faster, cleaner run gives you a better chance to climb.
              </p>
            </div>
            <Link href="/play/pwnit-2" className="rounded-full bg-[#0f172a] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#172554]">
              Play skill game
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-[#f0d9d1] bg-white shadow-sm">
          <div className="grid grid-cols-[70px_1fr_95px] gap-3 border-b border-[#f0d9d1] bg-[#fff7f4] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500 sm:grid-cols-[80px_1fr_120px_120px_120px]">
            <span>Rank</span>
            <span>Player</span>
            <span className="text-right">Score</span>
            <span className="hidden text-right sm:block">Best time</span>
            <span className="hidden text-right sm:block">Runs</span>
          </div>

          <div className="divide-y divide-[#f0d9d1]">
            {rows.map((entry) => {
              const isYou = entry.alias === "You";
              return (
                <div key={`${entry.alias}-${entry.score}`} className={`grid grid-cols-[70px_1fr_95px] gap-3 px-4 py-4 sm:grid-cols-[80px_1fr_120px_120px_120px] ${isYou ? "bg-[#effdfb]" : "bg-white"}`}>
                  <span className="font-black text-slate-950">#{entry.rank}</span>
                  <span>
                    <span className="block font-black text-slate-950">{entry.alias}</span>
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{entry.badge}</span>
                  </span>
                  <span className="text-right text-lg font-black text-[#10645c]">{entry.score}</span>
                  <span className="hidden text-right font-bold text-slate-700 sm:block">{entry.bestTime}</span>
                  <span className="hidden text-right font-bold text-slate-700 sm:block">{entry.attempts}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <InfoCard label="Game" value="Number Chain" />
          <InfoCard label="Activation" value={`${pwnit2DemoCampaign.activationPct}%`} />
          <InfoCard label="Countdown" value={pwnit2DemoCampaign.countdownLabel} />
        </div>
      </section>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#f0d9d1] bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}
