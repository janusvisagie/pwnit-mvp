import Link from "next/link";

export default function HowActivationWorksPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-900">How it works</h1>
        <p className="text-sm text-slate-600">A simple overview of activation, play, results, and buying the prize if you don’t win.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-extrabold text-slate-900">1) Pick a prize</div>
        <p className="mt-1 text-sm text-slate-700">Each prize shows its value, game type, play cost, and how close it is to going live.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-extrabold text-slate-900">2) Activation and countdown</div>
        <p className="mt-1 text-sm text-slate-700">Once a prize reaches its activation threshold, it goes live and the countdown starts. You can still play while the countdown is running.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-extrabold text-slate-900">3) Play and score</div>
        <p className="mt-1 text-sm text-slate-700">Play a quick skill game. Lower time is better. The leaderboard keeps each player’s best score.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-extrabold text-slate-900">4) Results</div>
        <p className="mt-1 text-sm text-slate-700">When the countdown ends, the prize closes and winners are published. Winning players get the prize.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-extrabold text-slate-900">5) Didn’t win? Buy it</div>
        <p className="mt-1 text-sm text-slate-700">If you didn’t win, you can still buy the prize. Your paid play spend on that prize counts as a discount, and you only pay the balance.</p>
        <p className="mt-2 text-xs text-slate-500">Payments are still MVP placeholders until a payment provider is connected.</p>
      </section>

      <div className="pt-1">
        <Link className="text-sm font-semibold text-slate-900 hover:underline" href="/">
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}
