"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Pwnit2CampaignCard from "@/components/Pwnit2CampaignCard";
import {
  pwnit2DemoCampaign,
  pwnit2HowItWorks,
  type Pwnit2CampaignSnapshot,
  type Pwnit2LeaderboardEntry,
} from "@/lib/pwnit2DemoCampaign";

type CampaignPayload = {
  ok: boolean;
  campaign?: Pwnit2CampaignSnapshot;
  leaderboard?: Pwnit2LeaderboardEntry[];
};

export default function Pwnit2Home() {
  const [campaign, setCampaign] = useState<Pwnit2CampaignSnapshot>(pwnit2DemoCampaign);
  const [leaderboard, setLeaderboard] = useState<Pwnit2LeaderboardEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCampaign() {
      try {
        const res = await fetch("/api/pwnit-2/campaign", { cache: "no-store" });
        const data = (await res.json()) as CampaignPayload;
        if (!cancelled && data.ok && data.campaign) {
          setCampaign(data.campaign);
          setLeaderboard(data.leaderboard ?? []);
        }
      } catch {
        // Keep the fallback campaign on screen if the API is temporarily unavailable.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    loadCampaign();
    const timer = window.setInterval(loadCampaign, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const topThree = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);
  const growth = campaign.growthZAR ?? 0;
  const inBuyWindow = campaign.state === "STATUS_WINDOW";

  return (
    <main className="min-h-screen bg-[#fffaf8] text-slate-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2.25rem] border border-[#e6ded9] bg-white shadow-sm shadow-slate-200/70">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6 bg-gradient-to-br from-[#0f172a] via-[#12324a] to-[#116466] p-6 text-white sm:p-8 lg:p-10">
              <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
                PwnIt 2.0
              </p>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  One voucher. One skill game. Win it or earn your discount.
                </h1>
                <p className="max-w-2xl text-base font-semibold leading-7 text-white/82 sm:text-lg">
                  Play Number Chain Sprint to fund the Checkers voucher. Every rand you spend playing
                  becomes a rand off the voucher — and the top score wins it outright.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={campaign.gameHref}
                  className="rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50"
                >
                  Play now
                </Link>
                <Link
                  href={campaign.leaderboardHref}
                  className="rounded-full border border-emerald-300/60 bg-emerald-400/15 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-400/25"
                >
                  View leaderboard
                </Link>
              </div>
            </div>

            <div className="space-y-4 bg-[#f3faf7] p-6 sm:p-8 lg:p-10">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Current campaign</p>
              <div className="rounded-[1.75rem] border border-[#cdebe0] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-950">{campaign.title}</h2>
                    <p className="mt-1 text-sm font-bold text-slate-600">{campaign.gameTitle}</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Voucher</p>
                    <p className="text-2xl font-black text-emerald-700">{campaign.currentValueLabel}</p>
                    {growth > 0 ? <p className="text-xs font-bold text-emerald-600">+R{growth} grown</p> : null}
                  </div>
                </div>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#e8efe9]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
                    style={{ width: `${campaign.activationPct}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>{campaign.countdownLabel}</span>
                  <span className="text-emerald-700">Your discount: R{campaign.yourDiscountZAR ?? 0}</span>
                </div>
                {inBuyWindow ? (
                  <Link
                    href="/pwnit-2/purchase"
                    className="mt-4 inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-700"
                  >
                    Buy the voucher
                  </Link>
                ) : null}
                {!loaded ? <p className="mt-2 text-xs font-bold text-slate-500">Refreshing…</p> : null}
              </div>
            </div>
          </div>
        </div>

        <Pwnit2CampaignCard campaign={campaign} />

        <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-[#e6ded9] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Leaderboard</p>
                <h2 className="mt-2 text-2xl font-black">Top players</h2>
              </div>
              <Link
                href={campaign.leaderboardHref}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800"
              >
                Full board
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {topThree.length ? (
                topThree.map((entry) => (
                  <div
                    key={`${entry.alias}-${entry.score}`}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-[#e6ded9] bg-[#fffaf8] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f172a] text-sm font-black text-white">
                        #{entry.rank}
                      </div>
                      <div>
                        <p className="font-black text-slate-950">{entry.alias}</p>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{entry.badge}</p>
                      </div>
                    </div>
                    <p className="text-xl font-black text-emerald-700">{entry.score}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[#e6ded9] bg-[#fffaf8] p-5 text-sm font-semibold text-slate-600">
                  No scores yet. Be the first to play.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#e6ded9] bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">How it works</p>
            <div className="mt-4 grid gap-3">
              {pwnit2HowItWorks.map((step, index) => (
                <div key={step.title} className="rounded-2xl border border-[#e6ded9] bg-[#fffaf8] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Step {index + 1}</p>
                  <h3 className="mt-1 font-black text-slate-950">{step.title}</h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
