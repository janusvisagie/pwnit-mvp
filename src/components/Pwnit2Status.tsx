"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { pwnit2DemoCampaign, type Pwnit2CampaignSnapshot, type Pwnit2LeaderboardEntry } from "@/lib/pwnit2DemoCampaign";

type CampaignPayload = {
  ok: boolean;
  campaign?: Pwnit2CampaignSnapshot;
  leaderboard?: Pwnit2LeaderboardEntry[];
};

export default function Pwnit2Status() {
  const [campaign, setCampaign] = useState<Pwnit2CampaignSnapshot>(pwnit2DemoCampaign);
  const [leaderboard, setLeaderboard] = useState<Pwnit2LeaderboardEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function loadStatus() {
      try {
        const res = await fetch("/api/pwnit-2/campaign", { cache: "no-store" });
        const data = (await res.json()) as CampaignPayload;
        if (!cancelled && data.ok) {
          if (data.campaign) setCampaign(data.campaign);
          setLeaderboard(data.leaderboard ?? []);
        }
      } catch {
        // Keep fallback state.
      }
    }
    loadStatus();
    const timer = window.setInterval(loadStatus, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const leader = leaderboard[0] ?? null;
  const statusText =
    campaign.state === "FUNDING"
      ? "Campaign is still building toward activation."
      : campaign.state === "COUNTDOWN"
        ? "Countdown is live. The board is still open for new scores."
        : campaign.state === "STATUS_WINDOW"
          ? "Campaign has closed. The board is frozen and final status is available."
          : "Campaign has been archived.";

  return (
    <main className="min-h-screen bg-[#fffaf8] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl space-y-5">
        <div className="rounded-[2rem] border border-[#ecd8d0] bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9f4d3d]">{campaign.title}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Campaign status</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-700">{statusText}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/" className="rounded-full bg-[#0f172a] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#172554]">
              Back to campaign
            </Link>
            <Link href="/pwnit-2/leaderboard" className="rounded-full border border-[#8bd7d0] bg-[#effdfb] px-5 py-3 text-sm font-black text-[#10645c] transition hover:-translate-y-0.5 hover:bg-white">
              Leaderboard
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatusCard label="Status" value={campaign.statusLabel} />
          <StatusCard label="Countdown" value={campaign.countdownLabel} />
          <StatusCard label="Top player" value={leader?.alias ?? "—"} />
          <StatusCard label="Top score" value={leader ? String(leader.score) : "—"} />
        </div>

        <div className="rounded-[2rem] border border-[#ecd8d0] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-2xl font-black">What happens here</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
            This page shows the live campaign state, countdown result, and final leaderboard status once the campaign closes.
          </p>
        </div>
      </section>
    </main>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#ecd8d0] bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}
