"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "pwnit_welcome_seen_session";

const steps = [
  { icon: "🎯", title: "Pick", body: "Choose a prize." },
  { icon: "⚡", title: "Play", body: "Post your best score." },
  { icon: "🏆", title: "Win", body: "Top the leaderboard." },
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
    <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-[2px]">
      <div className="flex min-h-dvh items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-[760px] overflow-hidden rounded-[26px] border border-white/60 bg-white shadow-[0_24px_80px_rgba(2,6,23,0.28)] ring-1 ring-slate-200/70">
          <div className="bg-[radial-gradient(circle_at_top_right,_rgba(103,232,249,0.20),_transparent_36%),linear-gradient(135deg,#020617,#0f172a_62%,#1f2937)] px-4 py-4 text-white sm:px-6 sm:py-5">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/75 sm:text-[11px]">
              Welcome to PwnIt
            </p>
            <h2 className="mt-1.5 text-[26px] font-black leading-none tracking-tight sm:text-[34px]">
              Pick. Play. <span className="text-cyan-400">PwnIt.</span>
            </h2>
            <p className="mt-2 max-w-[34rem] text-[13px] leading-5 text-white/82 sm:text-sm">
              Choose a prize, play one quick skill game, and try to win before the timer ends.
            </p>
          </div>

          <div className="space-y-3 p-3 sm:space-y-4 sm:p-4">
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-[18px] border border-slate-200 bg-gradient-to-br from-slate-50 to-white px-2.5 py-3 text-center shadow-sm sm:px-3 sm:py-3.5"
                >
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-lg shadow-sm ring-1 ring-slate-200 sm:h-10 sm:w-10 sm:text-xl">
                    {step.icon}
                  </div>
                  <div className="mt-2 text-[11px] font-black uppercase tracking-[0.12em] text-cyan-600 sm:text-xs">
                    {index + 1}
                  </div>
                  <div className="mt-1 text-sm font-black text-slate-900 sm:text-[15px]">{step.title}</div>
                  <p className="mt-1 text-[11px] leading-[1.05rem] text-slate-600 sm:text-xs sm:leading-[1.1rem]">{step.body}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-[12px] font-semibold leading-[1.05rem] text-slate-700 sm:px-4 sm:py-3 sm:text-sm">
              Didn&apos;t win? Buy it at a discount.
            </div>

            <button
              type="button"
              onClick={dismiss}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-[18px] bg-slate-950 px-5 py-3 text-[15px] font-extrabold text-white shadow-sm transition hover:bg-slate-800"
            >
              Start playing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
