import Link from "next/link";

const steps = [
  {
    title: "Choose a prize",
    body: "Pick the item you want to compete for and open its prize page to see the game, leaderboard, and current status.",
  },
  {
    title: "Practice first",
    body: "Use practice mode to learn the game before spending any credits.",
  },
  {
    title: "Play for real",
    body: "Use credits to post a real score for that specific prize.",
  },
  {
    title: "Climb the leaderboard",
    body: "The better your score, the higher your ranking for that prize round.",
  },
  {
    title: "Win prizes or bonus credits",
    body: "When a round closes, first place wins the prize. Runner-up credit rewards may apply where shown.",
  },
  {
    title: "Buy if available",
    body: "If Buy Now is available for a prize, your paid plays on that prize can build up a discount toward buying it. The exact discount and eligibility will be shown on that prize page and in the Terms & Conditions.",
  },
];

const extras = [
  "You can start as a guest and play without creating an account.",
  "Users currently receive 30 free credits per day.",
  "You can earn extra credits through referrals where offered.",
  "You can also earn extra credits by completing optional feedback surveys where offered.",
];

export default function HowActivationWorksPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-white/10 bg-black/20 p-6 sm:p-8">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-white/60">How it works</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">How PwnIt works</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/80 sm:text-lg">
            PwnIt uses skill-based competitions with clear rules and transparent scoring. Winners are determined by leaderboard performance, not a random draw.
          </p>
        </div>

        <section className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white/90">
                  {index + 1}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{step.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-white/75 sm:text-base">{step.body}</p>
                  {step.title === "Buy if available" ? (
                    <p className="mt-3 text-sm text-white/80">
                      Read the full{" "}
                      <Link href="/terms" className="font-medium underline decoration-white/40 underline-offset-4 hover:decoration-white">
                        Terms &amp; Conditions
                      </Link>
                      {" "}for full prize, credit, discount, and eligibility rules.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold text-white">Accounts, credits, and bonus rewards</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-white/75 sm:text-base">
            {extras.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1 text-white/50">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold text-white">If an item does not activate or a round is not live</h2>
          <p className="mt-3 text-sm leading-6 text-white/75 sm:text-base">
            Prize pages will show their current status. If a round is not open yet, you can still browse the item, practice the game where available, and come back when that prize is live.
          </p>
        </section>
      </div>
    </main>
  );
}
