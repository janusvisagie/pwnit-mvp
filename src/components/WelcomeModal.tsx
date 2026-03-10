"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "pwnit_welcome_seen";

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
    accent: "from-emerald-100 via-teal-50 to-white",
  },
];

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem(SESSION_KEY) === "true";
      setOpen(!seen);
    } catch {
      setOpen(true);
    }
  }, []);

  function dismiss() {
    try {
      sessionStorage.setItem(SESSION_KEY, "true");
    } catch {}
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.24),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(129,140,248,0.22),_transparent_32%),linear-gradient(135deg,#0f172a_0%,#111827_48%,#020617_100%)] px-5 py-6 text-white sm:px-8 sm:py-9">
          <div className="absolute -right-8 top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 left-1/3 h-16 w-16 rounded-full bg-cyan-300/10 blur-2xl" />

          <div className="relative">
            <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-300 sm:text-[11px]">Welcome to</div>
            <div className="mt-2 text-2xl font-black tracking-tight sm:text-4xl">
              Pick. Play. <span className="text-cyan-300">PwnIt.</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-4 py-4 sm:px-8 sm:py-6">
          <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            {steps.map((step) => (
              <div key={step.title} className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-4">
                <div className={`absolute inset-x-0 top-0 h-16 bg-gradient-to-br ${step.accent} sm:h-20`} />
                <div className="relative">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/60 bg-white/90 text-lg shadow-sm sm:mb-4 sm:h-11 sm:w-11 sm:text-xl">{step.icon}</div>
                  <div className="text-sm font-extrabold text-slate-900">{step.title}</div>
                  <div className="mt-1 text-sm leading-6 text-slate-600">{step.body}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm sm:mt-5">
            Or buy it if you don’t.
          </div>

          <div className="mt-4 flex items-center justify-end sm:mt-5">
            <button onClick={dismiss} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md sm:px-5">
              Start playing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
