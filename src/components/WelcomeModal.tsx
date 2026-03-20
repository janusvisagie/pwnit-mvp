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
      // Ignore blocked storage.
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 p-2 sm:flex sm:items-center sm:justify-center sm:p-4">
      <div className="mx-auto flex min-h-full w-full items-end justify-center sm:min-h-0 sm:items-center">
        <div className="w-full max-w-sm overflow-hidden rounded-[28px] bg-white shadow-2xl ring-1 ring-slate-200">
          <div className="border-b border-slate-100 bg-gradient-to-br from-amber-50 via-white to-white px-4 pb-3 pt-4 sm:px-5 sm:pb-4 sm:pt-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700 sm:text-xs">Welcome to PwnIt</p>
            <h2 className="mt-1 text-[1.45rem] font-extrabold tracking-tight text-slate-900 sm:text-[1.7rem]">Pick. Play. PwnIt.</h2>
            <p className="mt-1.5 text-sm leading-5 text-slate-600">
              Choose a prize, play a quick skill game, and try to win it.
            </p>
          </div>

          <div className="space-y-3 px-4 py-3 sm:px-5 sm:py-4">
            <div className="grid grid-cols-3 gap-2">
              {steps.map((step) => (
                <div key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-center">
                  <div className="text-lg leading-none" aria-hidden>
                    {step.icon}
                  </div>
                  <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-900">{step.title}</div>
                  <div className="mt-0.5 text-[11px] leading-4 text-slate-600">{step.body}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              <span className="font-medium">Daily free credits</span>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-amber-800 shadow-sm">30</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[12px] leading-4 text-slate-600">
              Practice first. Buy Now is always available. If an item does not activate, credits are refunded.
            </div>

            <label className="flex items-start gap-3 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={hideForever}
                onChange={(event) => setHideForever(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span className="leading-5">Do not show this welcome message again.</span>
            </label>

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
    </div>
  );
}

export default WelcomeModal;
