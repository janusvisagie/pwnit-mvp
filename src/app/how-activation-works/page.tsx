import Link from "next/link";

export default function HowActivationWorksPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 text-slate-900">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight">How it works</h1>
        <p className="mt-3 text-slate-600">
          
        </p>

        <div className="mt-8 space-y-6 text-sm leading-6 text-slate-700 md:text-base">
          <section>
            <h2 className="text-lg font-bold text-slate-900">1) Start as a guest or sign in</h2>
            <p className="mt-2">
              You can start playing straight away as a guest. Sign in when you want to save
              progress, buy credits, buy an item, claim a prize, or use features like
              referrals and feedback rewards more reliably across devices.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">2) Get 30 free credits each day</h2>
            <p className="mt-2">
              Each user currently receives <span className="font-semibold">30 free credits</span>{" "}
              per day to play. Once those are used, you can keep playing by using paid
              credits.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">3) Earn extra free credits</h2>
            <p className="mt-2">
              You earn extra free credits in two ways: by referring someone new
              to the platform, and by completing an optional feedback survey with suggestions
              to help improve PwnIt.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <span className="font-semibold">Referrals:</span> share your referral code or
                link. When a new player joins through you and qualifies, both of you can
                receive bonus credits.
              </li>
              <li>
                <span className="font-semibold">Feedback survey:</span> from time to time you
                may be offered free credits for completing a short optional suggestions survey.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">4) Pick a prize</h2>
            <p className="mt-2">
              Each prize shows the game type, play cost, value, and how close it is to going
              live.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">5) Activation and countdown</h2>
            <p className="mt-2">
              Prizes move through a visible activation threshold before they go live. Once a
              prize is activated, the countdown starts. Plays made before activation still
              count, and you can keep improving your score while the countdown is running.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">6) Practice first, then play for real</h2>
            <p className="mt-2">
              Use practice mode to warm up before spending credits. When you are ready,
              switch to a real attempt and post your best score to the leaderboard.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">7) Win the leaderboard</h2>
            <p className="mt-2">
              Your best score counts. At the end of the round, <span className="font-semibold">1st place</span>{" "}
              wins the item, while <span className="font-semibold">2nd</span> and <span className="font-semibold">3rd</span>{" "}
              receive credit bonuses.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">8) Did not win? Buy it</h2>
            <p className="mt-2">
              If you do not win, you can still buy the item. Your paid play spend on that
              item counts toward your discount, and you only pay the difference.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900">9) If an item does not activate</h2>
            <p className="mt-2">
              If a prize does not activate in time, paid credits used on that prize are
              returned to your wallet.
            </p>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
