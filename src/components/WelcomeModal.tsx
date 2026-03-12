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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-2.5 sm:p-4">
      <div className="w-full max-w-[980px] overflow-hidden rounded-[30px] bg-white shadow-2xl ring-1 ring-white/20">
        <div className="bg-[radial-gradient(circle_at_top_right,_rgba(103,232,249,0.16),_transparent_34%),linear-gradient(135deg,#020617,#0f172a_62%,#1f2937)] px-4 py-5 text-white sm:px-6 sm:py-6">
          <p className="text-[11px] font-black uppercase tracking-[0.26em] text-white/80 sm:text-xs">Welcome to</p>
          <h2 className="mt-2 text-[30px] font-black leading-none tracking-tight text-white sm:text-[40px] md:text-[46px]">
            Pick. Play. <span className="text-cyan-400">PwnIt.</span>
          </h2>
        </div>

        <div className="space-y-3 p-3.5 sm:space-y-4 sm:p-5">
          <div className="grid gap-2.5 sm:grid-cols-3 sm:gap-3">
            {steps.map((step) => (
              <div
                key={step.title}
                className={`rounded-[24px] border border-slate-200 bg-gradient-to-br ${step.accent} px-4 py-3 shadow-sm`}
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-xl shadow-sm ring-1 ring-slate-200/80">
                  {step.icon}
                </div>
                <div className="mt-3 text-[15px] font-black text-slate-900">{step.title}</div>
                <p className="mt-1.5 text-sm leading-6 text-slate-700">{step.body}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
              Or buy it if you don&apos;t.
            </div>

            <button
              type="button"
              onClick={dismiss}
              className="inline-flex min-h-[52px] items-center justify-center rounded-[20px] bg-slate-950 px-6 py-3 text-base font-extrabold text-white shadow-sm transition hover:bg-slate-800 sm:min-w-[220px]"
            >
              Start playing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
