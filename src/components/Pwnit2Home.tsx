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
  activationPct: demoState.activationPct,
  helper:
    "One focused voucher campaign is shown for the MVP. Value growth stays locked before activation; after activation, the countdown and final campaign sprint can begin.",
  primaryMetricLabel: "Funding target",
  primaryMetricValue: "100 pts",
  secondaryMetricLabel: "Collected",
  secondaryMetricValue: `${demoState.activationPoints} pts`,
  tertiaryMetricLabel: "Campaigns live",
  tertiaryMetricValue: "1",
};

const lifecycleSteps = [
  [PWNIT_2_SAFE_LIFECYCLE_COPY.fundingTitle, PWNIT_2_SAFE_LIFECYCLE_COPY.fundingBody],
  [PWNIT_2_SAFE_LIFECYCLE_COPY.countdownTitle, PWNIT_2_SAFE_LIFECYCLE_COPY.countdownBody],
  [PWNIT_2_SAFE_LIFECYCLE_COPY.closedTitle, PWNIT_2_SAFE_LIFECYCLE_COPY.closedBody],
  [PWNIT_2_SAFE_LIFECYCLE_COPY.archivedTitle, PWNIT_2_SAFE_LIFECYCLE_COPY.archivedBody],
] as const;

const workflowCards = [
  {
    label: "1",
    title: "Funding",
    body: "The voucher is visible, but the value does not grow yet. This keeps activation meaningful and keeps the MVP focused on one campaign.",
  },
  {
    label: "2",
    title: "Activation",
    body: "Once the activation threshold is met, the campaign unlocks its countdown phase and becomes time-limited.",
  },
  {
    label: "3",
    title: "Countdown",
    body: "The final sprint is where leaderboard pressure and campaign follow-through are tested. Purchases do not close the campaign.",
  },
  {
    label: "4",
    title: "Purchase window",
    body: "After closure, the result is frozen and a short follow-through window can remain open before the campaign archives.",
  },
];

const nextBuildBlocks = [
  "Make the single campaign database-backed instead of static.",
  "Wire existing skill-game entry points into the PwnIt 2 campaign status model.",
  "Freeze the leaderboard at closure and display the result state clearly.",
  "Keep the credit and purchasing routes present, but disabled until the new flow is intentionally implemented.",
  "Only add more vouchers after the one-campaign flow is stable.",
];

export default function Pwnit2Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d7fbf7_0,#fff7f2_30%,#ffffff_68%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl space-y-8">
        <div className="overflow-hidden rounded-[2.25rem] border border-slate-200 bg-white shadow-[0_26px_80px_rgba(15,23,42,0.10)]">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-7 bg-gradient-to-br from-slate-950 via-slate-900 to-[#0f766e] p-7 text-white sm:p-10">
              <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-[#8de3dd]">
                PwnIt 2.0 test branch
              </div>

              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                  One voucher campaign. A clearer PwnIt 2 flow.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
                  PwnIt 2 now replaces the old catalogue-style homepage with a single campaign board. The look returns to the brighter PwnIt feel, with the harsh amber softened into coral and peach accents.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8de3dd]">Live campaigns</p>
                  <p className="mt-2 text-3xl font-black">1</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f6b49e]">Before activation</p>
                  <p className="mt-2 text-3xl font-black">Locked</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8de3dd]">Build mode</p>
                  <p className="mt-2 text-3xl font-black">Demo</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/pwnit-2"
                  className="rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100"
                >
                  View lifecycle
                </Link>
                <Link
                  href="/buy-credits"
                  className="rounded-full border border-[#f6b49e] bg-[#fff7f2] px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-[#ffe6dc]"
                >
                  Credits status
                </Link>
                <Link
                  href="/feedback"
                  className="rounded-full border border-white/25 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
                >
                  Give feedback
                </Link>
              </div>
            </div>

            <div className="bg-white p-5 sm:p-7">
              <Pwnit2CampaignCard campaign={currentCampaign} />
            </div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          {workflowCards.map((card) => (
            <article key={card.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff7f2] text-sm font-black text-[#b85f4f]">
                {card.label}
              </div>
              <h2 className="mt-4 text-xl font-black text-slate-950">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{card.body}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.26em] text-[#0f766e]">Current campaign status</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">Funding phase</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{demoState.message}</p>

            <div className="mt-5 rounded-2xl bg-[#f0fdfa] p-5">
              <p className="text-4xl font-black text-slate-950">{demoState.activationPct}%</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                {demoState.activationPoints} points collected of {demoState.activationTargetPoints}
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.26em] text-[#b85f4f]">Next build blocks</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">Bigger steps, still testable</h2>
            <ul className="mt-5 space-y-3">
              {nextBuildBlocks.map((item) => (
                <li key={item} className="flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#14b8a6]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-[2rem] border border-[#f3c2b1] bg-[#fff7f2] p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-[#b85f4f]">Design update</p>
          <h2 className="mt-3 text-2xl font-black text-slate-950">Brighter again, but less harsh.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
            Patch 7 moves away from the dull earth-tone version and back toward the brighter PwnIt style: dark slate contrast, clean white cards, teal highlights and softer coral/peach accents instead of sharp amber/orange.
          </p>
        </section>
      </section>
    </main>
  );
}
