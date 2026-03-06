import Link from "next/link";

export default function HowActivationWorksPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-900">How it works</h1>
        <p className="text-sm text-slate-600">
          A simple guide to how prizes go live, how winners are decided, and how buying the difference works.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-extrabold text-slate-900">1) Pick a prize</div>
        <p className="mt-1 text-sm text-slate-700">
          Choose the prize you want to win. Each tile shows the prize value, game type, play cost, and whether the prize is open, going live soon, or live.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-extrabold text-slate-900">2) Play a quick skill game</div>
        <p className="mt-1 text-sm text-slate-700">
          You play a short skill game. Lower time is better. The leaderboard shows your best score for the day.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-extrabold text-slate-900">3) Activation & countdown</div>
        <p className="mt-1 text-sm text-slate-700">
          Each prize first needs enough activity to go live. Once it does, the countdown starts. You can still play while the countdown is running to improve your score and ranking.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-extrabold text-slate-900">4) Results</div>
        <p className="mt-1 text-sm text-slate-700">
          When the countdown ends, the prize closes and the winner is published. If you win, you receive the item — no need to buy it.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-extrabold text-slate-900">5) Buy now (optional)</div>
        <p className="mt-1 text-sm text-slate-700">You can buy an item at any time. The amount due is:</p>
        <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">Amount due = Price − Discount</div>
        <p className="mt-2 text-sm text-slate-700">
          Your discount is based on the paid credits you used playing that specific item today. If you did not win, you can still buy it by paying the difference.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-extrabold text-slate-900">Why users like it</div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Fast games and quick outcomes.</li>
          <li>Players can improve their score while the countdown is live.</li>
          <li>If they do not win, they still have the option to buy the prize.</li>
        </ul>
      </section>

      <div className="pt-1">
        <Link href="/" className="text-sm font-semibold text-slate-700 underline-offset-4 hover:underline">
          Back to home
        </Link>
      </div>
    </main>
  );
}
