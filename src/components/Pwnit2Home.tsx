import Link from "next/link";
import Pwnit2CampaignCard from "@/components/Pwnit2CampaignCard";
import { pwnit2DemoCampaign, pwnit2HowItWorks, pwnit2Leaderboard } from "@/lib/pwnit2DemoCampaign";

export default function Pwnit2Home() {
  const topThree = pwnit2Leaderboard.slice(0, 3);

  return (
    <main className="min-h-screen bg-[#fffaf8] text-slate-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2.25rem] border border-[#f0d9d1] bg-white shadow-sm shadow-slate-200/70">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6 bg-gradient-to-br from-[#0f172a] via-[#12324a] to-[#116466] p-6 text-white sm:p-8 lg:p-10">
              <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#b7f2ec]">
                PwnIt 2.0
              </p>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  One voucher. One skill game. One leaderboard.
                </h1>
                <p className="max-w-2xl text-base font-semibold leading-7 text-white/82 sm:text-lg">
                  Start with the Checkers voucher campaign, play Number Chain Sprint, and climb the campaign board while activation progress builds toward the countdown.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={pwnit2DemoCampaign.gameHref}
                  className="rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-[#fff7f4]"
                >
                  Play now
                </Link>
                <Link
                  href={pwnit2DemoCampaign.leaderboardHref}
                  className="rounded-full border border-[#8bd7d0] bg-[#8bd7d0]/15 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#8bd7d0]/25"
                >
                  View leaderboard
                </Link>
              </div>
            </div>

            <div className="space-y-4 bg-[#fff7f4] p-6 sm:p-8 lg:p-10">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#a64f3d]">Current campaign</p>
              <div className="rounded-[1.75rem] border border-[#f2c2b5] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-950">{pwnit2DemoCampaign.title}</h2>
                    <p className="mt-1 text-sm font-bold text-slate-600">{pwnit2DemoCampaign.gameTitle}</p>
                  </div>
                  <div className="rounded-2xl bg-[#effdfb] px-4 py-3 text-right">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#10645c]">Activation</p>
                    <p className="text-2xl font-black text-[#10645c]">{pwnit2DemoCampaign.activationPct}%</p>
                  </div>
                </div>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#f3e5df]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#14b8a6] to-[#f6a892]" style={{ width: `${pwnit2DemoCampaign.activationPct}%` }} />
                </div>
                <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
                  Voucher value is fixed at {pwnit2DemoCampaign.currentValueLabel} before activation. The countdown unlocks once the campaign reaches its activation target.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Pwnit2CampaignCard campaign={pwnit2DemoCampaign} />

        <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-[#f0d9d1] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#a64f3d]">Leaderboard</p>
                <h2 className="mt-2 text-2xl font-black">Top players</h2>
              </div>
              <Link href={pwnit2DemoCampaign.leaderboardHref} className="rounded-full border border-[#8bd7d0] bg-[#effdfb] px-4 py-2 text-sm font-black text-[#10645c]">
                Full board
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {topThree.map((entry) => (
                <div key={entry.alias} className="flex items-center justify-between gap-4 rounded-2xl border border-[#f0d9d1] bg-[#fffaf8] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f172a] text-sm font-black text-white">#{entry.rank}</div>
                    <div>
                      <p className="font-black text-slate-950">{entry.alias}</p>
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{entry.badge}</p>
                    </div>
                  </div>
                  <p className="text-xl font-black text-[#10645c]">{entry.score}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#f0d9d1] bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#a64f3d]">How it works</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {pwnit2HowItWorks.map((step, index) => (
                <div key={step.title} className="rounded-2xl border border-[#f0d9d1] bg-[#fffaf8] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#10645c]">Step {index + 1}</p>
                  <h3 className="mt-2 text-lg font-black text-slate-950">{step.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
