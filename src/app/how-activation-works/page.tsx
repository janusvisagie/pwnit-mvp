// src/app/how-activation-works/page.tsx
import Link from "next/link";

export default function HowActivationWorksPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-900">How it works</h1>
        <p className="text-sm text-slate-600">
          A simple MVP explanation of activation, scoring, results, and the “buy the difference” option.
        </p>
      </header>

<section className="rounded-2xl border border-slate-200 bg-white p-4">
  <div className="text-sm font-extrabold text-slate-900">1) Pick a prize</div>
  <p className="mt-1 text-sm text-slate-700">
    Choose the prize you want to win. Each tile shows the prize value, today’s activation progress, and the cost per play.
  </p>
</section>

<section className="rounded-2xl border border-slate-200 bg-white p-4">
  <div className="text-sm font-extrabold text-slate-900">2) Play a quick skill game</div>
  <p className="mt-1 text-sm text-slate-700">
    You play a short skill game. Lower time (ms) is better. The leaderboard shows your best score for the day.
  </p>
</section>

<section className="rounded-2xl border border-slate-200 bg-white p-4">
  <div className="text-sm font-extrabold text-slate-900">3) Activation & countdown</div>
  <p className="mt-1 text-sm text-slate-700">
    Items start in <span className="font-semibold">Open</span>. As people play, the entry counter increases. When the activation
    goal is reached, the item becomes <span className="font-semibold">Live</span> and the countdown starts. You can still play
    during activation and while the countdown is running to improve your time (and ranking).
  </p>
</section>

<section className="rounded-2xl border border-slate-200 bg-white p-4">
  <div className="text-sm font-extrabold text-slate-900">4) Results</div>
  <p className="mt-1 text-sm text-slate-700">
    When the countdown ends the item closes. Winners are published on the leaderboard.
  </p>
</section>

<section className="rounded-2xl border border-slate-200 bg-white p-4">
  <div className="text-sm font-extrabold text-slate-900">5) Buy now (optional)</div>
  <p className="mt-1 text-sm text-slate-700">You can buy an item at any time. The amount due is:</p>
  <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
    Amount due = Price − Discount
  </div>
  <p className="mt-2 text-sm text-slate-700">
    Where <span className="font-semibold">Discount</span> = 50% of the <span className="font-semibold">paid credits</span> you spent playing that item today.
    (1 credit = R1 in the MVP.)
  </p>
  <p className="mt-2 text-xs text-slate-500">Note: Payments are still “MVP placeholder” until a payment provider is wired.</p>
</section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-extrabold text-slate-900">Contact</div>
        <div className="mt-1 text-sm text-slate-700">
          WhatsApp: <span className="font-semibold">+27 00 000 0000</span> (demo)
        </div>
        <div className="mt-1 text-sm text-slate-700">
          Email: <span className="font-semibold">support@pwnit.local</span> (demo)
        </div>
      </section>

      <div className="pt-1">
        <Link className="text-sm font-semibold text-slate-900 hover:underline" href="/">
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}
