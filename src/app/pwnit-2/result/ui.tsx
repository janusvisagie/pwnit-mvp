"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  pwnit2DemoCampaign,
  type Pwnit2CampaignSnapshot,
  type Pwnit2LeaderboardEntry,
} from "@/lib/pwnit2DemoCampaign";

type CampaignPayload = {
  ok: boolean;
  campaign?: Pwnit2CampaignSnapshot;
  leaderboard?: Pwnit2LeaderboardEntry[];
};

export default function Pwnit2Result({ slug = "hero" }: { slug?: string }) {
  const campaignSlug = slug === "staple" ? "staple" : "hero";
  const q = `?item=${campaignSlug}`;
  const [campaign, setCampaign] = useState<Pwnit2CampaignSnapshot>(pwnit2DemoCampaign);
  const [leaderboard, setLeaderboard] = useState<Pwnit2LeaderboardEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/pwnit-2/campaign?item=${campaignSlug}`, { cache: "no-store" });
        const data = (await res.json()) as CampaignPayload;
        if (!cancelled && data.ok) {
          if (data.campaign) setCampaign(data.campaign);
          setLeaderboard(data.leaderboard ?? []);
        }
      } catch {
        // keep fallback
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    load();
    const timer = window.setInterval(load, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [campaignSlug]);

  const leader = leaderboard[0] ?? null;
  const yourRank = useMemo(() => leaderboard.find((e) => e.isYou)?.rank ?? null, [leaderboard]);
  const decided = campaign.state === "STATUS_WINDOW" || campaign.state === "ARCHIVED";
  const isWinnerYou = Boolean(campaign.isWinnerYou);
  const canBuy = Boolean(campaign.purchase?.canBuy);

  return (
    <main className="min-h-screen bg-[#fffaf8] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-2xl space-y-5">
        <div className="overflow-hidden rounded-[2rem] border border-[#e6ded9] bg-white shadow-sm">
          <div className="bg-gradient-to-br from-[#0f172a] via-[#12324a] to-[#116466] p-6 text-white sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">{campaign.title}</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              {decided ? "Campaign result" : "Campaign in progress"}
            </h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-white/82">
              {decided
                ? "The countdown has ended and the board is frozen."
                : "The result will be locked in when the countdown ends. Keep playing to climb."}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Final voucher value</p>
                <p className="mt-1 text-2xl font-black">{campaign.currentValueLabel}</p>
              </div>
              <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Winner</p>
                <p className="mt-1 text-2xl font-black">{campaign.winnerAlias ?? leader?.alias ?? "—"}</p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-6 sm:p-8">
            {isWinnerYou ? (
              <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5 text-center">
                <h2 className="text-2xl font-black text-emerald-900">You won it! 🎉</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-emerald-800">
                  Your score took the top spot. The voucher is yours — no purchase needed.
                </p>
              </div>
            ) : decided ? (
              <div className="rounded-2xl border border-[#e6ded9] bg-[#fffaf8] p-5 text-center">
                <h2 className="text-xl font-black">
                  {yourRank ? `You finished #${yourRank}` : "You didn't place this round"}
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  You keep the R{campaign.yourDiscountZAR ?? 0} discount you earned. Use it to buy the voucher
                  before the window closes.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-[#e6ded9] bg-[#fffaf8] p-5 text-center">
                <h2 className="text-xl font-black">
                  {yourRank ? `You're currently #${yourRank}` : "Play to get on the board"}
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  Top score: {leader ? leader.score : "—"} · Your discount so far: R{campaign.yourDiscountZAR ?? 0}
                </p>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-3">
              {canBuy ? (
                <Link
                  href={`/pwnit-2/purchase${q}`}
                  className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-700"
                >
                  Buy with your discount
                </Link>
              ) : null}
              <Link
                href={`/pwnit-2/leaderboard${q}`}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-black text-emerald-800 transition hover:-translate-y-0.5 hover:bg-white"
              >
                Full leaderboard
              </Link>
              <Link
                href="/"
                className="rounded-full bg-[#0f172a] px-6 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#172554]"
              >
                Back to campaign
              </Link>
            </div>
            {!loaded ? <p className="text-center text-xs font-bold text-slate-500">Refreshing…</p> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
