"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "pwnit_welcome_seen_session";

const steps = [
  {
    icon: "🎯",
    title: "Pick a prize",
    body: "Choose the reward you want to chase.",
    accent: "from-cyan-100 via-sky-50 to-white",
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
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[3px]" onClick={dismiss} />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[10%] top-[12%] h-2.5 w-2.5 rounded-full bg-cyan-300/70" />
        <div className="absolute right-[14%] top-[18%] h-2 w-2 rounded-full bg-blue-300/70" />
        <div className="absolute bottom-[20%] left-[18%] h-2 w-2 rounded-full bg-fuchsia-300/70" />
        <div className="absolute bottom-[14%] right-[10%] h-2.5 w-2.5 rounded-full bg-amber-300/70" />
      </div>

      <div className="relative w-full max-w-[860px] max-h-[92vh] overflow-y-auto rounded-[30px] border border-white/60 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.28)] ring-1 ring-slate-200">
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#020617_0%,#0f172a_42%,#1d4ed8_100%)] px-5 py-5 text-white sm:px-6 sm:py-6">
          <div className="absolute -right-6 top-4 text-5xl opacity-15 animate-pwnit-float">🎯</div>
          <div className="absolute bottom-3 left-5 text-4xl opacity-15 animate-pwnit-float" style={{ animationDelay: "0.6s" }}>
            🏆
          </div>
          <div className="absolute inset-x-0 top-0 h-px bg-white/40 pwnit-shimmer" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-white/85 backdrop-blur-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-300" />
              </span>
              Welcome to PwnIt
            </div>

            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Pick. Play. <span className="text-cyan-300">PwnIt.</span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-[15px] sm:leading-7">
              Choose a prize, play a quick skill game, and try to win it before the countdown ends.
            </p>
          </div>
        </div>

        <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-3.5">
            {steps.map((step) => (
              <div
                key={step.title}
                className={`rounded-[22px] border border-slate-200 bg-gradient-to-br ${step.accent} px-4 py-4 shadow-sm`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-xl shadow-sm ring-1 ring-slate-200">
                  {step.icon}
                </div>
                <div className="mt-3 text-[15px] font-black leading-tight text-slate-900">{step.title}</div>
                <div className="mt-1.5 text-[13px] leading-5 text-slate-700">{step.body}</div>
              </div>
            ))}
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 shadow-inner sm:text-[15px]">
            Or buy it if you don’t.
          </div>

          <div className="flex justify-end">
            <button
              onClick={dismiss}
              className="inline-flex min-h-[48px] items-center justify-center rounded-[18px] bg-slate-950 px-6 py-3 text-base font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Start playing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
