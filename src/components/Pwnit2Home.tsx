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

const homepagePrinciples = [
  "PwnIt 2.0 now owns the homepage on this branch.",
  "The same slate-and-white PwnIt visual language is retained.",
  "Legacy MVP routes remain available by direct URL for testing only.",
  "The old credit purchase link is not shown as a primary PwnIt 2.0 action.",
];

export default function Pwnit2Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5 p-6 sm:p-8 lg:p-10">
            <p className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">
              PwnIt 2.0 test branch
            </p>

            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Skill campaigns that activate before they close.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                PwnIt 2.0 is now presented as the primary experience on this branch. Campaigns start in a funding phase, activate after enough verified engagement, run through a clear countdown, then close and archive.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
                href="/pwnit-2"
              >
                View lifecycle
              </Link>
              <Link
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                href="/feedback"
              >
                Give feedback
              </Link>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Demo campaign</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Funding phase</h2>
                </div>
                <div className="rounded-2xl bg-slate-900 px-3 py-2 text-center text-white">
                  <p className="text-2xl font-black">{demoState.activationPct}%</p>
                  <p className="text-[0.65rem] font-bold uppercase tracking-wide text-slate-200">funded</p>
                </div>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                <div
                  className="h-full rounded-full bg-slate-900"
                  style={{ width: `${Math.min(100, Math.max(0, demoState.activationPct))}%` }}
                />
              </div>

              <div className="mt-4 flex items-center justify-between gap-4 text-sm text-slate-600">
                <span className="font-semibold">{demoState.activationPoints} points collected</span>
                <span>{demoState.activationTargetPoints} target</span>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">{demoState.message}</p>
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

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">Primary branch direction</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This patch makes the homepage copy more explicit: PwnIt 2.0 replaces the old landing experience on this branch. The legacy routes are still in the codebase so you can test and compare them, but they are not presented as the main product flow.
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">Patch 4 notes</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {homepagePrinciples.map((principle) => (
              <div key={principle} className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
                {principle}
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
