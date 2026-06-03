import Link from "next/link";

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

const lifecycleSteps = [
  [PWNIT_2_SAFE_LIFECYCLE_COPY.fundingTitle, PWNIT_2_SAFE_LIFECYCLE_COPY.fundingBody],
  [PWNIT_2_SAFE_LIFECYCLE_COPY.countdownTitle, PWNIT_2_SAFE_LIFECYCLE_COPY.countdownBody],
  [PWNIT_2_SAFE_LIFECYCLE_COPY.closedTitle, PWNIT_2_SAFE_LIFECYCLE_COPY.closedBody],
  [PWNIT_2_SAFE_LIFECYCLE_COPY.archivedTitle, PWNIT_2_SAFE_LIFECYCLE_COPY.archivedBody],
] as const;

const principles = [
  "Free-to-play, skill-first campaign flow",
  "Engagement-based activation before any countdown",
  "Countdown closes the campaign and freezes the result",
  "Progress, badges, XP and recognition stay separate from cash-equivalent rewards",
];

export default function Pwnit2Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-5">
            <p className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">
              PwnIt 2.0 foundation
            </p>
            <div className="space-y-3">
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Skill campaigns that activate before they close.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                This branch now treats PwnIt 2.0 as the primary experience: campaigns start in a funding phase, activate after enough verified engagement, run through a clear countdown, then close and archive.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
                href="/pwnit-2"
              >
                View lifecycle details
              </Link>
              <Link
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                href="/feedback"
              >
                Give feedback
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Demo activation</p>
            <div className="mt-4 space-y-3">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-4xl font-black text-slate-950">{demoState.activationPct}%</p>
                  <p className="text-sm text-slate-500">engagement progress</p>
                </div>
                <p className="text-right text-sm font-semibold text-slate-600">
                  {demoState.activationPoints} / {demoState.activationTargetPoints} points
                </p>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                <div
                  className="h-full rounded-full bg-slate-900"
                  style={{ width: `${Math.min(100, Math.max(0, demoState.activationPct))}%` }}
                />
              </div>
              <p className="text-sm leading-6 text-slate-600">{demoState.message}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {lifecycleSteps.map(([title, body], index) => (
          <article key={title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Step {index + 1}</p>
            <h2 className="mt-3 text-xl font-black text-slate-950">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">What this patch changes</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {principles.map((principle) => (
            <div key={principle} className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
              {principle}
            </div>
          ))}
        </div>
        <p className="mt-5 text-sm leading-6 text-slate-500">
          The old MVP routes still exist in the codebase for reference and controlled testing, but they are no longer presented as the primary landing experience on this branch.
        </p>
      </section>
    </main>
  );
}
