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

export default function Pwnit2FoundationPage() {
  const steps = [
    [PWNIT_2_SAFE_LIFECYCLE_COPY.fundingTitle, PWNIT_2_SAFE_LIFECYCLE_COPY.fundingBody],
    [PWNIT_2_SAFE_LIFECYCLE_COPY.countdownTitle, PWNIT_2_SAFE_LIFECYCLE_COPY.countdownBody],
    [PWNIT_2_SAFE_LIFECYCLE_COPY.closedTitle, PWNIT_2_SAFE_LIFECYCLE_COPY.closedBody],
    [PWNIT_2_SAFE_LIFECYCLE_COPY.archivedTitle, PWNIT_2_SAFE_LIFECYCLE_COPY.archivedBody],
  ];

  return (
    <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-5xl flex-col gap-6 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-white">
            PwnIt 2.0
          </span>
          <Link
            href="/"
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
          >
            Back to home
          </Link>
        </div>

        <h1 className="max-w-3xl text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
          Campaign lifecycle foundation
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
          Patch 2 adds direct navigation to this PwnIt 2 page and keeps this section focused on the safe lifecycle foundation:
          funding, countdown, closed, and archived.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {steps.map(([title, body], index) => (
          <article key={title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Step {index + 1}</span>
            <h2 className="mt-3 text-xl font-black text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">Demo activation state</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {demoState.activationPoints} / {demoState.activationTargetPoints} engagement points collected ({demoState.activationPct}%).
        </p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-slate-900" style={{ width: `${demoState.activationPct}%` }} />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-800">{demoState.message}</p>
      </section>
    </main>
  );
}
