"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { pwnit2DemoCampaign, type Pwnit2CampaignSnapshot, type Pwnit2LeaderboardEntry } from "@/lib/pwnit2DemoCampaign";

type CampaignPayload = {
  ok: boolean;
  campaign?: Pwnit2CampaignSnapshot;
  leaderboard?: Pwnit2LeaderboardEntry[];
};

export default function Pwnit2Leaderboard() {
  const [campaign, setCampaign] = useState<Pwnit2CampaignSnapshot>(pwnit2DemoCampaign);
  const [rows, setRows] = useState<Pwnit2LeaderboardEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadBoard() {
      try {
        const res = await fetch("/api/pwnit-2/campaign", { cache: "no-store" });
        const data = (await res.json()) as CampaignPayload;
        if (!cancelled && data.ok) {
          if (data.campaign) setCampaign(data.campaign);
          setRows(data.leaderboard ?? []);
        }
      } catch {
        // Keep the page usable even if the API is momentarily unavailable.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    loadBoard();
    const timer = window.setInterval(loadBoard, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#fffaf8] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl space-y-5">
        <div className="rounded-[2rem] border border-[#ecd8d0] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9f4d3d]">{campaign.title}</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Campaign leaderboard</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-700">
                Scores are saved to this campaign board. Faster, cleaner runs climb higher.
              </p>
              {!loaded ? <p className="mt-2 text-xs font-bold text-slate-500">Loading latest scores…</p> : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/play/pwnit-2" className="rounded-full bg-[#0f172a] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#172554]">
                Play skill game
              </Link>
              <Link href="/pwnit-2/status" className="rounded-full border border-[#f3c8bb] bg-[#fff7f3] px-5 py-3 text-sm font-black text-[#9f4d3d] transition hover:-translate-y-0.5 hover:bg-white">
                Status
              </Link>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-[#ecd8d0] bg-white shadow-sm">
          <div className="grid grid-cols-[70px_1fr_95px] gap-3 border-b border-[#ecd8d0] bg-[#fff7f3] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500 sm:grid-cols-[80px_1fr_120px_120px_120px]">
            <span>Rank</span>
            <span>Player</span>
            <span className="text-right">Score</span>
            <span className="hidden text-right sm:block">Best time</span>
            <span className="hidden text-right sm:block">Runs</span>
          </div>

          <div className="divide-y divide-[#ecd8d0]">
            {rows.length ? rows.map((entry) => (
              <div key={`${entry.alias}-${entry.score}-${entry.rank}`} className={`grid grid-cols-[70px_1fr_95px] gap-3 px-4 py-4 sm:grid-cols-[80px_1fr_120px_120px_120px] ${entry.isYou ? "bg-[#effdfb]" : "bg-white"}`}>
                <span className="font-black text-slate-950">#{entry.rank}</span>
                <span>
                  <span className="block font-black text-slate-950">{entry.alias}{entry.isYou ? " · you" : ""}</span>
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{entry.badge}</span>
                </span>
                <span className="text-right text-lg font-black text-[#10645c]">{entry.score}</span>
                <span className="hidden text-right font-bold text-slate-700 sm:block">{entry.bestTime}</span>
                <span className="hidden text-right font-bold text-slate-700 sm:block">{entry.attempts}</span>
              </div>
            )) : (
              <div className="bg-white px-4 py-10 text-center text-sm font-semibold text-slate-600">
                No saved scores yet. Play the first round to start the board.
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <InfoCard label="Game" value="Number Chain" />
          <InfoCard label="Activation" value={`${campaign.activationPct}%`} />
          <InfoCard label="Countdown" value={campaign.countdownLabel} />
        </div>
      </section>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#ecd8d0] bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}
