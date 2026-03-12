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
        <p className="mt-1 text-sm text-slate-700">Prizes move through a visible activation threshold before they go live. Once a prize is activated, the countdown starts. Scores posted before activation still count, and you can keep playing while the countdown is running.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-extrabold text-slate-900">3) Play and score</div>
        <p className="mt-1 text-sm text-slate-700">Play a quick skill game. Practice mode is available anytime, before or between paid plays, so you can warm up, learn the controls, or retry without spending credits. Each player’s best score stays on the leaderboard. 1st place wins the prize, while 2nd and 3rd place earn credit bonuses.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-extrabold text-slate-900">4) Results</div>
        <p className="mt-1 text-sm text-slate-700">When the countdown ends, the item closes and winners are published. The prize winner gets the item, and runner-up credit bonuses are added automatically.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-extrabold text-slate-900">5) Didn’t win? Buy it</div>
        <p className="mt-1 text-sm text-slate-700">If you didn’t win, you can still buy the prize. Your paid play spend on that prize counts as your discount, and you only pay the difference.</p>
        <p className="mt-2 text-xs text-slate-500">If a prize does not activate in time, paid credits used on that prize are returned to your wallet.</p>
      </section>

      <div className="pt-1">
        <Link className="text-sm font-semibold text-slate-900 hover:underline" href="/">
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}
