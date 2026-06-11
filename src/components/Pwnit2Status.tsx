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

export default function Pwnit2Status({ slug = "hero" }: { slug?: string }) {
  const campaignSlug = slug === "staple" ? "staple" : "hero";
  const q = `?item=${campaignSlug}`;
  const [campaign, setCampaign] = useState<Pwnit2CampaignSnapshot>(pwnit2DemoCampaign);
  const [leaderboard, setLeaderboard] = useState<Pwnit2LeaderboardEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function loadStatus() {
      try {
        const res = await fetch(`/api/pwnit-2/campaign?item=${campaignSlug}`, { cache: "no-store" });
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
  }, [campaignSlug]);

  const leader = leaderboard[0] ?? null;
  const yourRank = useMemo(() => leaderboard.find((e) => e.isYou)?.rank ?? null, [leaderboard]);
  const canBuy = Boolean(campaign.purchase?.canBuy);
  const isWinnerYou = Boolean(campaign.isWinnerYou);

  const statusText =
    campaign.state === "FUNDING"
      ? "The campaign is still building toward activation. Paid plays fund it and build your discount."
      : campaign.state === "COUNTDOWN"
        ? "The countdown is live. Keep playing to climb the leaderboard — and to earn more discount."
        : campaign.state === "STATUS_WINDOW"
          ? "The countdown has ended and the board is frozen. The top score wins the voucher; everyone else can buy it with their discount before the window closes."
          : "This campaign has been archived. The buy window has closed.";

  return (
    <main className="min-h-screen bg-[#fffaf8] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl space-y-5">
        <div className="rounded-[2rem] border border-[#e6ded9] bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">{campaign.title}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Campaign status</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-700">{statusText}</p>

          {isWinnerYou ? (
            <div className="mt-4 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">
              🎉 You hold the top score — the voucher is yours. No purchase needed.
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full bg-[#0f172a] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#172554]"
            >
              Back to campaign
            </Link>
            <Link
              href={`/pwnit-2/leaderboard${q}`}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-800 transition hover:-translate-y-0.5 hover:bg-white"
            >
              Leaderboard
            </Link>
            {canBuy ? (
              <Link
                href={`/pwnit-2/purchase${q}`}
                className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-700"
              >
                Buy the voucher
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatusCard label="Status" value={campaign.statusLabel} />
          <StatusCard label="Voucher value" value={campaign.currentValueLabel} highlight />
          <StatusCard label="Winner" value={campaign.winnerAlias ?? leader?.alias ?? "—"} />
          <StatusCard label="Your discount" value={`R${campaign.yourDiscountZAR ?? 0}`} highlight />
          <StatusCard label="Top score" value={leader ? String(leader.score) : "—"} />
          <StatusCard label="Your best rank" value={yourRank ? `#${yourRank}` : "—"} />
        </div>

        <div className="rounded-[2rem] border border-[#e6ded9] bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-2xl font-black">How the result works</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
            The highest score when the countdown ends wins the voucher outright. Everyone else keeps the
            discount they earned from paid plays and can buy the voucher at its final value, minus that
            discount, until the buy window closes. After that, the campaign archives and a new one can take
            its place.
          </p>
        </div>
      </section>
    </main>
  );
}

function StatusCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={[
        "rounded-2xl border p-5 shadow-sm",
        highlight ? "border-emerald-200 bg-emerald-50" : "border-[#e6ded9] bg-white",
      ].join(" ")}
    >
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${highlight ? "text-emerald-700" : "text-slate-950"}`}>{value}</p>
    </div>
  );
}
