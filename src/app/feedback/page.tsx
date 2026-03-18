import Link from "next/link";

import { FeedbackSurveyForm } from "@/components/FeedbackSurveyForm";
import { getCurrentSurveyStatus } from "@/lib/survey";

export default async function FeedbackPage() {
  const status = await getCurrentSurveyStatus();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 text-slate-900">
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-600">Help shape PwnIt</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Suggestions for free credits</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
            Tell us what you like, what should improve, and which prizes or features you want next.
            This survey is optional.
          </p>
          {status.submittedAt ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              Feedback for this survey was already submitted on {new Date(status.submittedAt).toLocaleDateString()}.
            </div>
          ) : null}
        </section>

        <FeedbackSurveyForm
          alreadySubmitted={status.alreadySubmitted}
          rewardCredits={status.rewardCredits}
        />

        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            ← Back to home
          </Link>
          <Link
            href="/referrals"
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            Referral rewards
          </Link>
        </div>
      </div>
    </main>
  );
}
