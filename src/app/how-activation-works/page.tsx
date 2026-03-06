import Link from "next/link";

export default function HowActivationWorksPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-900">How it works</h1>
        <p className="text-sm text-slate-600">A quick overview of activation, play, results, and the buy option.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-extrabold text-slate-900">1) Pick a prize</div>
        <p className="mt-1 text-sm text-slate-700">Each tile shows the prize value, game type, cost per play, and activation threshold.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-extrabold text-slate-900">2) Activation & countdown</div>
        <p className="mt-1 text-sm text-slate-700">Items start in <span className="font-semibold">Open</span>. Once the activation threshold is reached, the item goes <span className="font-semibold">Live</span> and the countdown starts.</p>
        <p className="mt-2 text-sm text-slate-700">You can still play while the countdown is running.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-extrabold text-slate-900">3) Play & scoring</div>
        <p className="mt-1 text-sm text-slate-700">Play the skill game linked to that prize. Lower time (ms) is better. The leaderboard shows the best score per player.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-extrabold text-slate-900">4) Results</div>
        <p className="mt-1 text-sm text-slate-700">When the countdown ends, the item closes and winners are published. Winners receive the item and do not need to buy it.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-extrabold text-slate-900">5) Buy now</div>
        <p className="mt-1 text-sm text-slate-700">If you do not win, you can still buy the item. Your paid credits spent playing that item count as your discount, and you only pay the difference.</p>
        <p className="mt-2 text-xs text-slate-500">Payments are still MVP placeholders until a payment provider is connected.</p>
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
