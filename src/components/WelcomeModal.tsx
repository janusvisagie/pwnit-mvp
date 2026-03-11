"use client";

import { useEffect, useState } from "react";

const KEY = "pwnit_welcome_seen_v1";

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const seen = window.localStorage.getItem(KEY);
      if (!seen) setOpen(true);
    } catch {
      // ignore blocked storage
    }
  }, []);

  function dismiss() {
    setOpen(false);
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      // ignore blocked storage
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 sm:p-4">
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="px-5 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">
            Welcome to
          </p>
          <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950">PwnIt</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700 sm:text-[15px]">
            Pick a prize, play a quick skill game, and try to win it.
            <span className="font-semibold text-slate-950"> Or buy it if you don&apos;t.</span>
          </p>

          <ul className="mt-4 space-y-2 text-sm leading-5 text-slate-700">
            <li>
              <span className="font-semibold text-slate-950">Activation:</span> enough plays make the item go live.
            </li>
            <li>
              <span className="font-semibold text-slate-950">Live:</span> once active, the countdown starts.
            </li>
            <li>
              <span className="font-semibold text-slate-950">Results:</span> winners show after the timer ends.
            </li>
          </ul>
        </div>

        <div className="border-t border-slate-100 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-slate-800"
          >
            Start playing
          </button>
        </div>
      </div>
    </div>
  );
}
