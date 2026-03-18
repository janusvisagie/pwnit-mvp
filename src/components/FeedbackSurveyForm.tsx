"use client";

import { useState } from "react";

export function FeedbackSurveyForm({
  alreadySubmitted,
  rewardCredits,
}: {
  alreadySubmitted: boolean;
  rewardCredits: number;
}) {
  const [overall, setOverall] = useState("5");
  const [favorite, setFavorite] = useState("Winning prizes");
  const [improve, setImprove] = useState("");
  const [nextPrize, setNextPrize] = useState("");
  const [contactOk, setContactOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(
    alreadySubmitted ? "This survey reward has already been claimed for this survey." : null,
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/api/surveys/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          overall,
          favorite,
          improve,
          nextPrize,
          contactOk,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        setMessage(data?.error || "Could not submit your feedback right now.");
        return;
      }

      setMessage(`Thanks — ${data.rewardCredits ?? rewardCredits} free credits have been added.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">Feedback reward survey</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Share your suggestions and receive <span className="font-semibold">{rewardCredits} free credits</span>. One reward per browser/account for this survey.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-900">Overall experience</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <label key={value} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800">
                <input
                  type="radio"
                  name="overall"
                  value={String(value)}
                  checked={overall === String(value)}
                  onChange={(event) => setOverall(event.target.value)}
                />
                {value}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900">What do you like most so far?</label>
          <select
            value={favorite}
            onChange={(event) => setFavorite(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          >
            <option>Winning prizes</option>
            <option>Practice mode</option>
            <option>Daily free credits</option>
            <option>The product/prize idea</option>
            <option>The skill games</option>
            <option>The buy-if-you-don&apos;t-win option</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900">What should we improve?</label>
          <textarea
            value={improve}
            onChange={(event) => setImprove(event.target.value)}
            rows={5}
            placeholder="Please share at least one clear suggestion."
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900">What prizes or features would you like next?</label>
          <textarea
            value={nextPrize}
            onChange={(event) => setNextPrize(event.target.value)}
            rows={3}
            placeholder="Optional"
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          />
        </div>

        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={contactOk}
            onChange={(event) => setContactOk(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />
          <span>You may contact me about my feedback.</span>
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={busy || alreadySubmitted}
            className="min-h-11 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Submitting…" : alreadySubmitted ? "Already claimed" : `Submit for +${rewardCredits} credits`}
          </button>
        </div>
      </form>

      {message ? <div className="mt-5 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</div> : null}
    </div>
  );
}

export default FeedbackSurveyForm;
