"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "pwnit_welcome_seen_session";

const steps = [
  { n: "1", title: "Pick", body: "Choose a prize." },
  { n: "2", title: "Play", body: "Post your best score." },
  { n: "3", title: "Win", body: "Top the leaderboard." },
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
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm"
      style={{
        paddingTop: "max(12px, env(safe-area-inset-top))",
        paddingRight: "12px",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        paddingLeft: "12px",
      }}
    >
      <div className="flex min-h-full items-end justify-center sm:items-center">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-900 text-white shadow-2xl">
          <div className="border-b border-white/10 px-4 pb-3 pt-4 sm:px-5 sm:pb-4 sm:pt-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-cyan-300/90">
              Welcome to PwnIt
            </p>
            <h2 className="mt-1 text-[clamp(1.45rem,5.7vw,2rem)] font-semibold leading-[1.05] tracking-tight text-white">
              Pick. Play. PwnIt.
            </h2>
            <p className="mt-2 text-sm leading-5 text-slate-300 sm:text-[15px]">
              Choose a prize, play a quick skill game, and try to win it.
            </p>
          </div>

          <div className="px-4 py-3 sm:px-5 sm:py-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {steps.map((step) => (
                <div
                  key={step.n}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-2 text-center sm:px-3 sm:py-3"
                >
                  <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-cyan-400/15 text-xs font-semibold text-cyan-300 sm:h-8 sm:w-8">
                    {step.n}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-white sm:mt-2">
                    {step.title}
                  </div>
                  <div className="mt-0.5 text-[11px] leading-4 text-slate-300 sm:text-xs">
                    {step.body}
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-3 text-center text-xs leading-4 text-slate-300 sm:mt-4 sm:text-sm">
              Or buy it if you don&apos;t win.
            </p>

            <button
              type="button"
              onClick={dismiss}
              className="mt-3 w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/70 sm:mt-4"
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
