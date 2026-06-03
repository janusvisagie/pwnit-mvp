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

const currentCampaign: Pwnit2CampaignCardModel = {
  title: "Checkers Voucher",
  category: "First PwnIt 2 MVP campaign",
  statusLabel: "Funding",
  statusTone: "funding",
  baseValueLabel: "R500",
  currentValueLabel: "R500",
  activationPct: 60,
  helper:
    "Only one voucher campaign is shown for the MVP. Value growth stays locked before activation. Once activated, the countdown starts and the winner value can grow under the PwnIt 2 campaign rules.",
  primaryMetricLabel: "Funding target",
  primaryMetricValue: "100 pts",
  secondaryMetricLabel: "Collected",
  secondaryMetricValue: "60 pts",
  tertiaryMetricLabel: "Campaigns live",
  tertiaryMetricValue: "1",
};

const lifecycleSteps = [
  [PWNIT_2_SAFE_LIFECYCLE_COPY.fundingTitle, PWNIT_2_SAFE_LIFECYCLE_COPY.fundingBody],
  [PWNIT_2_SAFE_LIFECYCLE_COPY.countdownTitle, PWNIT_2_SAFE_LIFECYCLE_COPY.countdownBody],
  [PWNIT_2_SAFE_LIFECYCLE_COPY.closedTitle, PWNIT_2_SAFE_LIFECYCLE_COPY.closedBody],
  [PWNIT_2_SAFE_LIFECYCLE_COPY.archivedTitle, PWNIT_2_SAFE_LIFECYCLE_COPY.archivedBody],
] as const;

const userPromiseCards = [
  {
    label: "One live campaign",
    title: "Start focused",
    body: "PwnIt 2 begins with one voucher campaign so the activation, countdown, leaderboard and purchase-window experience can be tuned before scaling to more items.",
  },
  {
    label: "Before activation",
    title: "Value growth locked",
    body: "The base voucher value is shown immediately, but it does not grow until the campaign has activated.",
  },
  {
    label: "After activation",
    title: "Countdown sprint",
    body: "The campaign enters the time-limited sprint phase. The winner value can grow, the leaderboard becomes more urgent and purchases remain separate from closure.",
  },
];

const conversionRoadmap = [
  "Replace static MVP data with one database-backed PwnIt 2 campaign.",
  "Connect play attempts to the PwnIt 2 campaign lifecycle instead of old item rounds.",
  "Add campaign-specific balance display without reusing the old PwnIt 1 credit assumptions.",
  "Add a frozen leaderboard and short post-closure purchase window once the campaign state model is in place.",
  "Only reintroduce multiple simultaneous vouchers after the first campaign flow is stable.",
  "Preserve localhost demo-user switching for testing throughout the conversion.",
];

export default function Pwnit2Home() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] border border-[#e1d4c5] bg-[#fffaf3] shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative overflow-hidden p-6 sm:p-8 lg:p-10">
            <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-[#d5a77f]/25 blur-3xl" />
            <div className="absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-[#91aa98]/25 blur-3xl" />

            <div className="relative space-y-5">
              <p className="inline-flex rounded-full bg-[#efe1d2] px-3 py-1 text-sm font-black text-[#7c5638] ring-1 ring-[#dbc7b1]">
                PwnIt 2.0 test branch
              </p>

              <div className="space-y-3">
                <h1 className="max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  One voucher. One campaign. Then scale what works.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[#66584d] sm:text-lg">
                  PwnIt 2.0 now starts with a single focused voucher campaign instead of a three-card catalogue. This keeps the MVP simple while we convert the old item-grid experience into the new activation, countdown, closure and purchase-window flow.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {userPromiseCards.map((card) => (
                  <div key={card.label} className="rounded-2xl border border-[#e1d4c5] bg-white/75 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-[#8a6a53]">{card.label}</p>
                    <p className="mt-1 text-sm font-black text-slate-900">{card.title}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  className="rounded-full bg-[#2f3a32] px-5 py-3 text-sm font-black text-white transition hover:bg-[#3f4d43]"
                  href="/pwnit-2"
                >
                  View lifecycle
                </Link>
                <Link
                  className="rounded-full border border-[#cdbba7] bg-white px-5 py-3 text-sm font-black text-[#5f5047] transition hover:bg-[#fbf3ea]"
                  href="/buy-credits"
                >
                  Credits status
                </Link>
                <Link
                  className="rounded-full border border-[#cdbba7] bg-[#fbf3ea] px-5 py-3 text-sm font-black text-[#705038] transition hover:border-[#b89572]"
                  href="/feedback"
                >
                  Give feedback
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-[#e1d4c5] bg-[#2f3a32] p-6 text-white sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-[#dfc7aa]">Current campaign status</p>
                  <h2 className="mt-2 text-2xl font-black">Funding phase</h2>
                </div>
                <div className="rounded-2xl bg-[#fffaf3] px-3 py-2 text-center text-[#2f3a32]">
                  <p className="text-2xl font-black">{demoState.activationPct}%</p>
                  <p className="text-[0.65rem] font-black uppercase tracking-wide text-[#75695f]">funded</p>
                </div>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/15 ring-1 ring-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#c98d63] via-[#d8b99d] to-[#8eaa98]"
                  style={{ width: `${Math.min(100, Math.max(0, demoState.activationPct))}%` }}
                />
              </div>

              <div className="mt-4 flex items-center justify-between gap-4 text-sm text-[#e9ded0]">
                <span className="font-bold">{demoState.activationPoints} points collected</span>
                <span>{demoState.activationTargetPoints} target</span>
              </div>

              <p className="mt-4 text-sm leading-6 text-[#e1d7cb]">{demoState.message}</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#8a6a53]">Current campaign</p>
            <h2 className="text-3xl font-black tracking-tight text-slate-950">The first PwnIt 2 voucher</h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-[#66584d]">
            The MVP now shows one voucher campaign, not three examples. Additional vouchers should only return once the one-campaign flow is database-backed and stable.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.72fr]">
          <Pwnit2CampaignCard campaign={currentCampaign} />
          <aside className="rounded-[1.75rem] border border-[#e1d4c5] bg-[#fffaf3] p-5 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#8a6a53]">Campaign promise</p>
            <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Focused before broad.</h3>
            <div className="mt-5 space-y-3">
              {userPromiseCards.map((card) => (
                <div key={card.title} className="rounded-2xl border border-[#e5d8ca] bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-[#8a6a53]">{card.label}</p>
                  <h4 className="mt-1 font-black text-slate-950">{card.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-[#66584d]">{card.body}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {lifecycleSteps.map(([title, body], index) => (
          <article key={title} className="rounded-3xl border border-[#e1d4c5] bg-[#fffaf3] p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-[#9a765c]">Step {index + 1}</p>
            <h2 className="mt-3 text-xl font-black text-slate-950">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-[#66584d]">{body}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[2rem] border border-[#e1d4c5] bg-[#fffaf3] p-6 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#6f8b78]">Build sequence</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Bigger steps from here</h2>
            <p className="mt-3 text-sm leading-6 text-[#66584d]">
              We do not need to keep moving in tiny cosmetic patches. The safer path is to move in larger, testable conversion blocks: first a single campaign shell, then database-backed campaign state, then play/leaderboard integration, then the purchase-window experience.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {conversionRoadmap.map((item) => (
              <div key={item} className="rounded-2xl bg-white p-4 text-sm font-bold leading-6 text-[#5f5047] ring-1 ring-[#e1d4c5]">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
