"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "pwnit_welcome_seen_session";
const HIDE_FOREVER_KEY = "pwnit_welcome_hide_forever";

const steps = [
  { icon: "🎯", title: "Pick", body: "Choose a prize you want." },
  { icon: "⚡", title: "Play", body: "Use your credits and post your best score." },
  { icon: "🏆", title: "Win", body: "Top the leaderboard and win the prize." },
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
      }
    } catch {
      // ignore blocked storage
    }
  }

  function hidePermanentlyNow() {
    setHideForever(true);
    setOpen(false);

    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
      window.localStorage.setItem(HIDE_FOREVER_KEY, "1");
    } catch {
      // ignore blocked storage
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-4 py-6">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl md:p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
          Welcome to PwnIt
        </p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
          Pick. Play. PwnIt.
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
          Choose a prize, play a quick skill game, and try to win it.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl" aria-hidden>
                  {step.icon}
                </span>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-slate-500">
                  {index + 1}
                </span>
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-900">{step.title}</h3>
              <p className="mt-1 text-sm leading-5 text-slate-600">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You currently receive <span className="font-semibold">30 free credits per day</span>{" "}
          to get started.
        </div>

        <label className="mt-5 flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={hideForever}
            onChange={(event) => setHideForever(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
          />
          <span>Do not show this welcome message again.</span>
        </label>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Start playing
          </button>
          <button
            type="button"
            onClick={hidePermanentlyNow}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Hide permanently
          </button>
        </div>
      </div>
    </div>
  );
}

export default WelcomeModal;
