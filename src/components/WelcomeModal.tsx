"use client";

import { useEffect, useState } from "react";

const KEY = "pwnit_welcome_seen_session_v1_3";

const steps = [
  {
    title: "Pick a prize",
    body: "Choose the reward you want to chase.",
    accent: "from-sky-500/20 to-cyan-400/10",
    icon: "🎯",
  },
  {
    title: "Play a skill game",
    body: "One quick challenge decides your score.",
    accent: "from-violet-500/20 to-fuchsia-400/10",
    icon: "⚡",
  },
  {
    title: "Win",
    body: "Beat the leaderboard and take the prize.",
    accent: "from-emerald-500/20 to-teal-400/10",
    icon: "🏆",
  },
];

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const seen = window.sessionStorage.getItem(KEY);
      if (!seen) {
        window.sessionStorage.setItem(KEY, "1");
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  function dismiss() {
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm" onClick={dismiss} role="dialog" aria-modal="true" aria-label="Welcome">
      <div className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.35)]" onClick={(e) => e.stopPropagation()}>
        <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.24),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(129,140,248,0.22),_transparent_32%),linear-gradient(135deg,#0f172a_0%,#111827_48%,#020617_100%)] px-6 py-7 text-white sm:px-8 sm:py-9">
          <div className="absolute -right-8 top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-0 left-1/3 h-16 w-16 rounded-full bg-cyan-300/10 blur-2xl" />

          <div className="relative">
            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-300">Welcome to</div>
            <div className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Pick. Play. <span className="text-cyan-300">PwnIt.</span></div>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-6 sm:px-8">
          <div className="grid gap-4 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.title} className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-br ${step.accent}`} />
                <div className="relative">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/60 bg-white/90 text-xl shadow-sm">{step.icon}</div>
                  <div className="text-sm font-extrabold text-slate-900">{step.title}</div>
                  <div className="mt-1 text-sm leading-6 text-slate-600">{step.body}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">Or buy it if you don’t.</div>

          <div className="mt-5 flex items-center justify-end">
            <button onClick={dismiss} className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md">
              Start playing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
