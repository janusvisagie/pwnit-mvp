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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-2.5 sm:p-4">
      <div className="flex max-h-[calc(100dvh-1rem)] w-full max-w-sm flex-col overflow-y-auto rounded-[28px] bg-white shadow-2xl ring-1 ring-slate-200 sm:max-h-[calc(100dvh-2rem)]">
        <div className="px-4 pb-3 pt-4 sm:px-5 sm:pb-4 sm:pt-5">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Welcome to</p>
          <h2 className="mt-1 text-[28px] font-black tracking-tight text-slate-950 sm:text-[30px]">PwnIt</h2>
          <p className="mt-2.5 text-sm leading-5 text-slate-700 sm:text-[15px] sm:leading-6">
            Pick a prize, play a quick skill game, and try to win it.
            <span className="font-semibold text-slate-950"> Or buy it if you don&apos;t.</span>
          </p>

          <ul className="mt-3.5 space-y-1.5 text-[13px] leading-5 text-slate-700 sm:text-sm sm:leading-5">
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

        <div className="border-t border-slate-100 px-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-3 sm:px-5">
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex min-h-[46px] w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-slate-800"
          >
            Start playing
          </button>
        </div>
      </div>
    </div>
  );
}
