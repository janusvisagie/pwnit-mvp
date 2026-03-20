"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "pwnit_welcome_seen_session";
const HIDE_KEY = "pwnit_welcome_hide_permanently";

const steps = [
  { n: "1", title: "Pick", body: "Choose a prize." },
  { n: "2", title: "Play", body: "Post your best score." },
  { n: "3", title: "Win", body: "Top the leaderboard." },
] as const;

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const [hideAgain, setHideAgain] = useState(false);

  useEffect(() => {
    try {
      const hidden = window.localStorage.getItem(HIDE_KEY);
      const seen = window.sessionStorage.getItem(SESSION_KEY);
      if (!hidden && !seen) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  function dismiss() {
    setOpen(false);

    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
      if (hideAgain) {
        window.localStorage.setItem(HIDE_KEY, "1");
      }
    } catch {
      // ignore blocked storage
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-4 sm:px-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl ring-1 ring-slate-200 sm:p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Welcome
            </p>
            <div className="leading-none">
              <span className="text-xl font-semibold text-slate-700 sm:text-2xl">Pick. Play.</span>{" "}
              <span className="text-3xl font-black text-slate-950 sm:text-4xl">PwnIt.</span>
            </div>
            <p className="text-sm text-slate-600 sm:text-base">
              Choose a prize, play a quick skill game, and try to win it.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {steps.map((step) => (
              <div key={step.n} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  {step.n}
                </div>
                <div className="text-sm font-bold text-slate-900">{step.title}</div>
                <div className="mt-1 text-xs leading-5 text-slate-600">{step.body}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
            You receive 30 free credits per day.
          </div>

          <label className="flex items-start gap-3 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={hideAgain}
              onChange={(e) => setHideAgain(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
            />
            <span>Do not show this welcome message again.</span>
          </label>

          <button
            type="button"
            onClick={dismiss}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-slate-800"
          >
            Start playing
          </button>
        </div>
      </div>
    </div>
  );
}

export default WelcomeModal;
