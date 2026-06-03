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
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-8 text-slate-100">
      <section className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-black/30">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">PwnIt 2.0</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Campaign lifecycle foundation</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
          Patch 1 adds the clean lifecycle language and helper logic for a free-to-play, skill-first campaign flow:
          funding, countdown, closed, and archived.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {steps.map(([title, body], index) => (
          <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <div className="text-sm font-bold text-cyan-300">Step {index + 1}</div>
            <h2 className="mt-2 text-xl font-bold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <h2 className="text-xl font-bold">Demo activation state</h2>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-cyan-300" style={{ width: `${demoState.activationPct}%` }} />
        </div>
        <p className="mt-3 text-sm text-slate-300">
          {demoState.activationPoints} / {demoState.activationTargetPoints} engagement points collected ({demoState.activationPct}%).
        </p>
        <p className="mt-2 text-sm text-slate-400">{demoState.message}</p>
      </section>
    </main>
  );
}
