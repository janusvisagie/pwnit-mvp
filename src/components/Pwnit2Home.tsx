"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Pwnit2CampaignCard from "@/components/Pwnit2CampaignCard";
import WelcomeModal from "@/components/WelcomeModal";
import {
  pwnit2DemoCampaign,
  pwnit2HowItWorks,
  type Pwnit2CampaignSnapshot,
  type Pwnit2LeaderboardEntry,
} from "@/lib/pwnit2DemoCampaign";

type CampaignEntry = {
  slug: string;
  campaign: Pwnit2CampaignSnapshot;
  leaderboard: Pwnit2LeaderboardEntry[];
};

type ListPayload = {
  ok: boolean;
  campaigns?: CampaignEntry[];
};

const demoEntries: CampaignEntry[] = [{ slug: "hero", campaign: pwnit2DemoCampaign, leaderboard: [] }];

export default function Pwnit2Home() {
  const [entries, setEntries] = useState<CampaignEntry[]>(demoEntries);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadCampaigns() {
      try {
        const res = await fetch("/api/pwnit-2/campaign", { cache: "no-store" });
        const data = (await res.json()) as ListPayload;
        if (!cancelled && data.ok && Array.isArray(data.campaigns) && data.campaigns.length) {
          setEntries(data.campaigns);
        }
      } catch {
        // Keep the fallback on screen if the API is temporarily unavailable.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    loadCampaigns();
    const timer = window.setInterval(loadCampaigns, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const hero = useMemo(() => entries.find((e) => e.slug === "hero") ?? entries[0], [entries]);
  const heroCampaign = hero?.campaign ?? pwnit2DemoCampaign;
  const heroTop = useMemo(() => (hero?.leaderboard ?? []).slice(0, 3), [hero]);
  const heroGrowth = heroCampaign.growthZAR ?? 0;
  const heroQ = `?item=${hero?.slug ?? "hero"}`;

  return (
    <main className="min-h-screen bg-[#fffaf8] text-slate-950">
      <WelcomeModal />
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2.25rem] border border-[#e6ded9] bg-white shadow-sm shadow-slate-200/70">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6 bg-gradient-to-br from-[#0f172a] via-[#12324a] to-[#116466] p-6 text-white sm:p-8 lg:p-10">
              <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
                Pick. Play. PwnIt.
              </p>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  Two prizes. One memory game. Win it or earn your discount.
                </h1>
                <p className="max-w-2xl text-base font-semibold leading-7 text-white/82 sm:text-lg">
                  Play Memory Sprint to fund a prize. Every rand you spend playing becomes a rand off the
                  voucher — and the top score wins it outright when the countdown ends.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href={heroCampaign.gameHref ?? `/play/pwnit-2${heroQ}`} className="rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50">
                  Play now
                </Link>
                <Link href={heroCampaign.leaderboardHref ?? `/pwnit-2/leaderboard${heroQ}`} className="rounded-full border border-emerald-300/60 bg-emerald-400/15 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-400/25">
                  View leaderboard
                </Link>
              </div>
            </div>

            <div className="space-y-4 bg-[#f3faf7] p-6 sm:p-8 lg:p-10">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Featured prize</p>
              <div className="rounded-[1.75rem] border border-[#cdebe0] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-950">{heroCampaign.title}</h2>
                    <p className="mt-1 text-sm font-bold text-slate-600">{heroCampaign.gameTitle}</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Voucher</p>
                    <p className="text-2xl font-black text-emerald-700">{heroCampaign.currentValueLabel}</p>
                    {heroGrowth > 0 ? <p className="text-xs font-bold text-emerald-600">+R{heroGrowth} grown</p> : null}
                  </div>
                </div>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#e8efe9]">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" style={{ width: `${heroCampaign.activationPct}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>{heroCampaign.countdownLabel}</span>
                  <span className="text-emerald-700">Your discount: R{heroCampaign.yourDiscountZAR ?? 0}</span>
                </div>
                {heroCampaign.state === "STATUS_WINDOW" ? (
                  <Link href={`/pwnit-2/purchase${heroQ}`} className="mt-4 inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-700">
                    Buy the voucher
                  </Link>
                ) : null}
                {!loaded ? <p className="mt-2 text-xs font-bold text-slate-500">Refreshing…</p> : null}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Live campaigns</p>
              <h2 className="mt-1 text-2xl font-black">Pick a prize to play for</h2>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {entries.map((entry) => (
              <Pwnit2CampaignCard key={entry.slug} campaign={entry.campaign} />
            ))}
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-[#e6ded9] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Leaderboard</p>
                <h2 className="mt-2 text-2xl font-black">{heroCampaign.title}</h2>
              </div>
              <Link href={heroCampaign.leaderboardHref ?? `/pwnit-2/leaderboard${heroQ}`} className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800">
                Full board
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {heroTop.length ? (
                heroTop.map((entry) => (
                  <div key={`${entry.alias}-${entry.score}`} className="flex items-center justify-between gap-4 rounded-2xl border border-[#e6ded9] bg-[#fffaf8] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f172a] text-sm font-black text-white">#{entry.rank}</div>
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
