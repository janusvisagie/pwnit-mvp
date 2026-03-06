import Link from "next/link";

export default function HowActivationWorksPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-900">How it works</h1>
        <p className="text-sm text-slate-600">A simple walkthrough of how prizes, play, results, and buying work.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-extrabold text-slate-900">1) Pick a prize</div>
        <p className="mt-1 text-sm text-slate-700">Each tile shows the prize, the game type, and the cost per play.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-extrabold text-slate-900">2) Activation & countdown</div>
        <p className="mt-1 text-sm text-slate-700">
          Items start in <span className="font-semibold">Open</span>. Once the activation threshold is reached, the item becomes <span className="font-semibold">Live</span> and the countdown starts. Play is still possible while the countdown is running.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-extrabold text-slate-900">3) Play & scoring</div>
        <p className="mt-1 text-sm text-slate-700">You play a quick skill game. Lower time (ms) is better. The leaderboard shows the best score per player.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-extrabold text-slate-900">4) Results</div>
        <p className="mt-1 text-sm text-slate-700">When the countdown ends, the item closes and winners are published. Winners get the item.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-extrabold text-slate-900">5) Buy now</div>
        <p className="mt-1 text-sm text-slate-700">If you didn&apos;t win, you can still buy the item at a reduced price. Paid credits you used on that item count as your discount.</p>
        <p className="mt-2 text-xs text-slate-500">Note: Payments are still an MVP placeholder until a payment provider is wired.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-extrabold text-slate-900">Contact</div>
        <div className="mt-1 text-sm text-slate-700">WhatsApp: <span className="font-semibold">+27 00 000 0000</span> (demo)</div>
        <div className="mt-1 text-sm text-slate-700">Email: <span className="font-semibold">support@pwnit.local</span> (demo)</div>
      </section>

      <div className="pt-1">
        <Link className="text-sm font-semibold text-slate-900 hover:underline" href="/">
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}
