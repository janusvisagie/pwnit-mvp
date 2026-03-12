"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "pwnit_welcome_seen_session";

const steps = [
  {
    icon: "🎯",
    title: "Pick a prize",
    body: "Choose the reward you want to chase.",
    accent: "from-sky-100 via-cyan-50 to-white",
  },
  {
    icon: "⚡",
    title: "Play a skill game",
    body: "One quick challenge decides your score.",
    accent: "from-violet-100 via-fuchsia-50 to-white",
  },
  {
    icon: "🏆",
    title: "Win",
    body: "Beat the leaderboard and take the prize.",
    accent: "from-amber-100 via-orange-50 to-white",
  },
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-5">
      <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" onClick={dismiss} />

      <div className="relative w-full max-w-[760px] overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.16),_transparent_30%),linear-gradient(135deg,#020617,#0f172a_45%,#1e293b)] px-6 py-5 text-white sm:px-7 sm:py-6">
          <div className="text-[13px] font-black uppercase tracking-[0.28em] text-white/80">Welcome to</div>
          <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-[42px]">
            Pick. Play. <span className="text-cyan-400">PwnIt.</span>
          </h2>
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {steps.map((step) => (
              <div
                key={step.title}
                className={`rounded-[22px] border border-slate-200 bg-gradient-to-br ${step.accent} px-3 py-3 shadow-sm sm:px-4 sm:py-4`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 text-lg shadow-sm ring-1 ring-slate-200">
                  {step.icon}
                </div>
                <div className="mt-3 text-[13px] font-black leading-tight text-slate-900 sm:text-[15px]">
                  {step.title}
                </div>
                <div className="mt-1.5 text-[12px] leading-5 text-slate-700 sm:text-[13px]">
                  {step.body}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] font-medium text-slate-700 shadow-inner">
            Or buy it if you don’t.
          </div>

          <div className="flex justify-end">
            <button
              onClick={dismiss}
              className="inline-flex min-h-[48px] items-center justify-center rounded-[18px] bg-slate-950 px-6 py-3 text-base font-extrabold text-white shadow-sm transition hover:bg-slate-800"
            >
              Start playing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
