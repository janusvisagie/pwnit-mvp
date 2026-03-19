const sections = [
  {
    title: "1. Pick a prize",
    body: "Choose the item you want to compete for. Each prize has its own challenge, activation target, and timing window.",
  },
  {
    title: "2. Activation comes first*",
    body: "A prize round only starts once enough support has built up for that item. After activation, the countdown begins and the live competition opens.",
  },
  {
    title: "3. Practice first, then play for real",
    body: "You can warm up in practice mode before posting a real score. Real plays use credits and count toward the leaderboard.",
  },
  {
    title: "4. Win by performance",
    body: "Leaderboard position is determined by performance under the published game rules and timing logic. The top player wins the prize. Runner-up rewards may also apply.",
  },
  {
    title: "5. Did not win? You may still be able to buy it",
    body: "For certain items, non-winning players can still buy the item at a reduced effective price based on the platform rules for that item.",
  },
  {
    title: "6. Start as a guest or create an account",
    body: "You can get started as a guest. Creating an account lets you keep progress, see your dashboard, claim prizes, buy items, and use features like referrals more easily.",
  },
  {
    title: "7. Bonus ways to grow your balance",
    body: "You may receive daily free credits*, referral rewards when invited players genuinely join and play, and optional feedback rewards for useful suggestions.",
  },
  {
    title: "8. Clear rules matter",
    body: "PwnIt is presented as a skill-based competition platform with fair scoring and clear rules. Read the Terms & Conditions and any competition-specific rules that apply to each item or round.",
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

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm leading-6 text-amber-950 shadow-sm md:text-base">
        <p>
          <span className="font-semibold">*</span> Daily free credits, referrals, feedback rewards, prize structures, and activation rules may vary over time and may be limited to prevent abuse.
        </p>
      </section>
    </main>
  );
}
