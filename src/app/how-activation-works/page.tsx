import Link from "next/link";

const sections = [
  {
    title: "1. Pick a prize",
    body: "Choose the item you want to compete for. Each prize has its own challenge and live leaderboard.",
  },
  {
    title: "2. Practice first",
    body: "You can warm up in practice mode before using any credits. Practice helps you learn the game before posting a real score.",
  },
  {
    title: "3. Play for real",
    body: "Use credits to post a real score on that prize leaderboard. Real plays count toward your position for that specific item.",
  },
  {
    title: "4. Win by performance",
    body: "Leaderboard position is determined by performance under the published game rules and timing logic. The top player wins the prize. Runner-up rewards may also apply where shown.",
  },
  {
    title: "5. Buy Now is always available",
    body: "If you do not win, you can still buy the item. Your paid plays on that item build up a discount toward the buy price, which is shown on the item page.",
  },
  {
    title: "6. Start as a guest or create an account",
    body: "You can get started as a guest. Creating an account lets you keep progress, view your dashboard, claim prizes, buy items, and use features like referrals more easily.",
  },
  {
    title: "7. Credits and bonus rewards",
    body: "You may receive daily free credits, referral rewards when invited players genuinely join and play, and optional feedback rewards for useful suggestions.",
  },
  {
    title: "8. If an item does not activate",
    body: "Credits spent on items that do not activate are refunded back to your balance in line with the item flow shown on the platform.",
  },
  {
    title: "9. Clear rules matter",
    body: "PwnIt uses skill-based competitions with fair scoring and clear rules. Winners are determined by leaderboard performance, not a random draw. See the Terms & Conditions and any item-specific rules that apply.",
  },
] as const;

export default function HowActivationWorksPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 md:px-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">How it works</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">Pick a prize. Play for position. Win on skill.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
          PwnIt combines short skill challenges, live leaderboards, and prize-based competition. The key flow is below.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <article key={section.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">{section.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700 md:text-base">{section.body}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Read the full rules</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700 md:text-base">
          For eligibility, fair-play rules, referrals, feedback rewards, purchases, prize claims, and platform conduct, please read the full{" "}
          <Link href="/terms" className="font-semibold text-amber-700 underline decoration-amber-300 underline-offset-4 hover:text-amber-800">
            Terms &amp; Conditions
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
