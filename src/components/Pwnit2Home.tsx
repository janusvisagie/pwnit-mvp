import Link from "next/link";

import Pwnit2CampaignCard, { type Pwnit2CampaignCardModel } from "@/components/Pwnit2CampaignCard";
import { PWNIT_2_SAFE_LIFECYCLE_COPY, getPwnit2LifecycleState } from "@/lib/pwnit2Lifecycle";

const demoState = getPwnit2LifecycleState({
  status: "FUNDING",
  activationTargetPoints: 100,
  engagementEvents: [
    { source: "SKILL_ATTEMPT", points: 30 },
    { source: "UNIQUE_PARTICIPANT", points: 18 },
    { source: "VERIFIED_REFERRAL", points: 12 },
  ],
});

const campaigns: Pwnit2CampaignCardModel[] = [
  {
    title: "Checkers Voucher",
    category: "Everyday voucher",
    statusLabel: "Funding",
    statusTone: "funding",
    baseValueLabel: "R500",
    currentValueLabel: "R500",
    activationPct: 60,
    helper: "Pre-activation value growth is locked. This campaign must activate before any countdown or winner-value growth can start.",
    primaryMetricLabel: "Target",
    primaryMetricValue: "100 pts",
    secondaryMetricLabel: "Collected",
    secondaryMetricValue: "60 pts",
  },
  {
    title: "Takealot Voucher",
    category: "Retail voucher",
    statusLabel: "Countdown",
    statusTone: "countdown",
    baseValueLabel: "R500",
    currentValueLabel: "R760",
    activationPct: 100,
    helper: "After activation, the countdown runs and the final winner value can grow under the controlled PwnIt 2 rules.",
    primaryMetricLabel: "Time left",
    primaryMetricValue: "18h 40m",
    secondaryMetricLabel: "Status",
    secondaryMetricValue: "Live",
  },
  {
    title: "Fuel Voucher",
    category: "Daily utility",
    statusLabel: "Closed",
    statusTone: "closed",
    baseValueLabel: "R250",
    currentValueLabel: "R410",
    activationPct: 100,
    helper: "When a campaign closes, the result is frozen. A short post-close review window keeps the user experience clear before archival.",
    primaryMetricLabel: "Result",
    primaryMetricValue: "Frozen",
    secondaryMetricLabel: "Next step",
    secondaryMetricValue: "Archive",
  },
];

const lifecycleSteps = [
  [PWNIT_2_SAFE_LIFECYCLE_COPY.fundingTitle, PWNIT_2_SAFE_LIFECYCLE_COPY.fundingBody],
  [PWNIT_2_SAFE_LIFECYCLE_COPY.countdownTitle, PWNIT_2_SAFE_LIFECYCLE_COPY.countdownBody],
  [PWNIT_2_SAFE_LIFECYCLE_COPY.closedTitle, PWNIT_2_SAFE_LIFECYCLE_COPY.closedBody],
  [PWNIT_2_SAFE_LIFECYCLE_COPY.archivedTitle, PWNIT_2_SAFE_LIFECYCLE_COPY.archivedBody],
] as const;

const nextBuildBlocks = [
  "Replace static campaign cards with database-backed PwnIt 2 campaigns.",
  "Add campaign-specific wallet/ledger rules before any live credit purchase flow is enabled.",
  "Preserve demo-user switching on localhost for testing.",
  "Keep the PwnIt 1 routes available by direct URL until replacements are stable.",
];

export default function Pwnit2Home() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative overflow-hidden p-6 sm:p-8 lg:p-10">
            <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-amber-300/30 blur-3xl" />
            <div className="absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-cyan-300/30 blur-3xl" />

            <div className="relative space-y-5">
              <p className="inline-flex rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-3 py-1 text-sm font-black text-white shadow-sm">
                PwnIt 2.0 test branch
              </p>

              <div className="space-y-3">
                <h1 className="max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  Campaigns fund first. Then the countdown begins.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  PwnIt 2.0 is now the primary experience on this branch. The homepage has moved from the old item-grid MVP toward a campaign board built around activation, countdown, closure and archival.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-amber-700">Before activation</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">Value growth locked</p>
                </div>
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-cyan-700">After activation</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">Countdown starts</p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-700">After closure</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">Result freezes</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  className="rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                  href="/pwnit-2"
                >
                  View lifecycle
                </Link>
                <Link
                  className="rounded-full border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-black text-amber-800 transition hover:border-amber-400 hover:bg-amber-100"
                  href="/buy-credits"
                >
                  Credits page
                </Link>
                <Link
                  className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800"
                  href="/feedback"
                >
                  Give feedback
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-950 p-6 text-white sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-amber-200">Demo activation</p>
                  <h2 className="mt-2 text-2xl font-black">Funding phase</h2>
                </div>
                <div className="rounded-2xl bg-white px-3 py-2 text-center text-slate-950">
                  <p className="text-2xl font-black">{demoState.activationPct}%</p>
                  <p className="text-[0.65rem] font-black uppercase tracking-wide text-slate-500">funded</p>
                </div>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/15 ring-1 ring-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-cyan-300"
                  style={{ width: `${Math.min(100, Math.max(0, demoState.activationPct))}%` }}
                />
              </div>

              <div className="mt-4 flex items-center justify-between gap-4 text-sm text-slate-200">
                <span className="font-bold">{demoState.activationPoints} points collected</span>
                <span>{demoState.activationTargetPoints} target</span>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-300">{demoState.message}</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-600">Campaign board</p>
            <h2 className="text-3xl font-black tracking-tight text-slate-950">PwnIt 2.0 campaign states</h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            These are static MVP examples for now. The next implementation step is to replace them with real database-backed campaigns on the pwnit-2 branch.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <Pwnit2CampaignCard key={campaign.title} campaign={campaign} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {lifecycleSteps.map(([title, body], index) => (
          <article key={title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-orange-500">Step {index + 1}</p>
            <h2 className="mt-3 text-xl font-black text-slate-950">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-700">Build sequence</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">What comes after this patch</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Patch 5 keeps pushing this branch away from the old PwnIt 1 presentation and toward a PwnIt 2 campaign system, while keeping higher-risk mechanics behind explicit implementation gates.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {nextBuildBlocks.map((item) => (
              <div key={item} className="rounded-2xl bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-700 ring-1 ring-slate-200">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
