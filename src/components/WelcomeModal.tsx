"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "pwnit_welcome_seen_session";

const steps = [
  { icon: "🎯", title: "Pick", body: "Choose a prize you want to win." },
  { icon: "⚡", title: "Play", body: "Post your best score before time runs out." },
  { icon: "🏆", title: "Win", body: "Top the leaderboard and claim the prize." },
] as const;

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const seen = window.sessionStorage.getItem(SESSION_KEY);
      if (!seen) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  function dismiss() {
    setOpen(false);
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // ignore blocked storage
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-4 backdrop-blur-sm">
      <div className="fade-in w-full max-w-xl rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <div className="border-b border-slate-100 px-5 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-6">
          <div className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-cyan-700">
            Welcome to PwnIt
          </div>

          <h2 className="mt-3 text-[28px] font-black leading-none tracking-tight text-slate-900 sm:text-[34px]">
            Pick. Play. <span className="text-cyan-600">PwnIt.</span>
          </h2>

          <p className="mt-3 max-w-[34rem] text-sm leading-6 text-slate-600">
            Choose a prize, play one quick skill game, and try to win before the timer ends.
          </p>
        </div>

        <div className="space-y-4 px-5 py-4 sm:px-7 sm:py-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-center shadow-sm"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg shadow-sm">
                  {step.icon}
                </div>
                <div className="mt-2 text-[11px] font-black uppercase tracking-[0.16em] text-cyan-700">
                  {index + 1}
                </div>
                <div className="mt-1 text-[15px] font-black text-slate-900">{step.title}</div>
                <p className="mt-1 text-xs leading-5 text-slate-600">{step.body}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-700">
            Didn&apos;t win? You can still buy the item at a discount.
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-black text-white transition hover:bg-slate-800"
          >
            Start playing
          </button>
        </div>
      </div>
    </div>
  );
}

export default WelcomeModal;
