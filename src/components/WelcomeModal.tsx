"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "pwnit_welcome_seen_session";
const HIDE_FOREVER_KEY = "pwnit_welcome_hide_forever";

const steps = [
  { icon: "🎯", title: "Pick", body: "Choose a prize." },
  { icon: "⚡", title: "Play", body: "Post your best score." },
  { icon: "🏆", title: "Win", body: "Top the leaderboard." },
] as const;

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const [hideForever, setHideForever] = useState(false);

  useEffect(() => {
    try {
      const hiddenForever = window.localStorage.getItem(HIDE_FOREVER_KEY) === "1";
      const seenThisSession = window.sessionStorage.getItem(SESSION_KEY) === "1";

      if (!hiddenForever && !seenThisSession) {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  function dismiss() {
    setOpen(false);

    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
      if (hideForever) {
        window.localStorage.setItem(HIDE_FOREVER_KEY, "1");
      } else {
        window.localStorage.removeItem(HIDE_FOREVER_KEY);
      }
    } catch {
      // ignore blocked storage
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-3 sm:p-4">
      <div className="max-h-[92svh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">
          Welcome to PwnIt
        </p>
        <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Pick. Play. PwnIt.
        </h2>
        <p className="mt-2 text-sm leading-5 text-slate-600">
          Choose a prize, play a quick skill game, and try to win it.
        </p>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xl" aria-hidden>
                  {step.icon}
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-500">
                  {index + 1}
                </span>
              </div>
              <h3 className="mt-2 text-sm font-bold text-slate-900">{step.title}</h3>
              <p className="mt-0.5 text-xs leading-5 text-slate-600 sm:text-sm">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900">
          You receive <span className="font-semibold">30 free credits per day</span>.
        </div>

        <label className="mt-4 flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={hideForever}
            onChange={(event) => setHideForever(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
          />
          <span>Do not show this welcome message again.</span>
        </label>

        <div className="mt-5">
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Start playing
          </button>
        </div>
      </div>
    </div>
  );
}

export default WelcomeModal;
