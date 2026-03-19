const sections = [
  {
    title: "1. Overview",
    body: [
      "PwnIt is a skill-based prize platform. Players use credits to enter short skill challenges linked to specific items or prizes.",
      "Leaderboard position, score, timing, and published rules determine outcomes. PwnIt does not describe prize awards as random draws.",
    ],
  },
  {
    title: "2. Eligibility and accounts",
    body: [
      "Guests may browse and play where permitted. Certain actions, including purchases, prize claims, or other higher-trust actions, may require a signed-in account.",
      "Users must provide accurate details when creating an account or claiming a prize.",
    ],
  },
  {
    title: "3. Credits, referrals, and feedback rewards",
    body: [
      "PwnIt may offer daily free credits, referrals, feedback rewards, or promotional credits. These offers may change, may be capped, and may be withdrawn if abuse is detected.",
      "Referral rewards apply only to qualified referrals and may be withheld if multiple accounts, duplicate devices, or other abusive behaviour is suspected.",
    ],
  },
  {
    title: "4. Leaderboards and prizes",
    body: [
      "Each item or round may have its own activation threshold, countdown, scoring rule, and prize or runner-up reward structure.",
      "Ties, disputes, suspicious activity, and scoring anomalies may be resolved under PwnIt’s published rules and fair-play processes.",
    ],
  },
  {
    title: "5. Purchases and fulfilment",
    body: [
      "Where buy-now or discounted purchase options are offered, checkout, payment, and fulfilment details will be shown before confirmation.",
      "Prize claims and purchases may require identity, delivery, or contact verification.",
    ],
  },
  {
    title: "6. Fair play and abuse",
    body: [
      "PwnIt may limit, suspend, or disqualify accounts or entries where bots, duplicate accounts, scripted interactions, false identities, collusion, or other abuse is suspected.",
      "PwnIt may use device, browser, session, and account checks to protect fairness.",
    ],
  },
  {
    title: "7. Privacy and contact",
    body: [
      "PwnIt will use personal information only for operating the platform, account management, fulfilment, security, and related support purposes.",
      "A fuller privacy notice, competition-specific rules, and any updated legal terms should be read together with these Terms & Conditions.",
    ],
  },
] as const;

export default function TermsPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 md:px-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">Terms &amp; Conditions</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">Clear rules. Fair play.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
          These are starter terms for the MVP. They should be refined with your formal legal review before wider public rollout.
        </p>
      </section>

      <section className="space-y-4">
        {sections.map((section) => (
          <article key={section.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">{section.title}</h2>
            <div className="mt-3 space-y-3 text-sm leading-6 text-slate-700 md:text-base">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
