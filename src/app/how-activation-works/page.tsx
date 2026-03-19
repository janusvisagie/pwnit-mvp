import Link from "next/link";

const sections = [
  {
    title: "1. Pick a prize",
    body: "Choose the item you want to compete for. Each prize has its own game and leaderboard.",
  },
  {
    title: "2. Practice first",
    body: "Practice mode lets you learn the game before spending credits.",
  },
  {
    title: "3. Play for real",
    body: "Use credits to post a real score on that item's leaderboard.",
  },
  {
    title: "4. Win by skill",
    body: "Leaderboard rank is based on performance. First place wins the prize. Runner-up rewards may apply where shown.",
  },
  {
    title: "5. Buy Now",
    body: "Buy Now is always available. Paid plays on an item build up a discount on that same item.",
  },
  {
    title: "6. Guest or account",
    body: "You can start as a guest. Creating an account makes it easier to keep progress, claim prizes, and buy items.",
  },
  {
    title: "7. Extra credits",
    body: "Daily free credits, referral rewards, and feedback rewards may be available.",
  },
  {
    title: "8. Refunds",
    body: "Credits spent on items that do not activate are refunded.",
  },
  {
    title: "9. Fair rules",
    body: "PwnIt uses skill-based competitions with clear scoring. Winners are decided by leaderboard performance, not a random draw.",
  },
] as const;

export default function HowActivationWorksPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 md:px-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">How it works</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">Pick a prize. Play for position. Win on skill.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
          PwnIt combines short skill challenges, live leaderboards, and prize-based competition.
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
          For eligibility, fair play, purchases, prize claims, referrals, feedback rewards, and platform conduct, read the full{" "}
          <Link href="/terms" className="font-semibold text-amber-700 underline decoration-amber-300 underline-offset-4 hover:text-amber-800">
            Terms &amp; Conditions
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
