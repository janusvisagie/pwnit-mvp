// src/components/WelcomeModal.tsx
"use client";

import { useEffect, useState } from "react";

const KEY = "pwnit_welcome_seen_session_v1_2";

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show once per browser session
    try {
      const seen = window.sessionStorage.getItem(KEY);
      if (!seen) {
        window.sessionStorage.setItem(KEY, "1");
        setOpen(true);
      }
    } catch {
      // storage blocked -> still show once on mount
      setOpen(true);
    }
  }, []);

  function dismiss() {
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4"
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome"
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1">
          <div className="text-xs font-semibold text-slate-600">Welcome to</div>
          <div className="text-2xl font-extrabold tracking-tight text-slate-900">
            PwnIt <span className="text-base">👋</span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="text-xs font-extrabold text-slate-900">1) Pick a prize</div>
            <div className="mt-1 text-sm text-slate-600">Choose what you want to win.</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="text-xs font-extrabold text-slate-900">2) Play a quick skill game</div>
            <div className="mt-1 text-sm text-slate-600">Your best time ranks higher.</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="text-xs font-extrabold text-slate-900">3) Win!</div>
            <div className="mt-1 text-sm text-slate-600">Top players take the prizes.</div>
          </div>
        </div>

        <div className="mt-3 text-sm font-semibold text-slate-900">If you didn&apos;t win - buy it!</div>

        <div className="mt-4 flex items-center justify-end">
          <button
            onClick={dismiss}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800"
          >
            Start playing
          </button>
        </div>
      </div>
    </div>
  );
}
