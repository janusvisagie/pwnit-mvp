"use client";

import { useEffect, useState } from "react";

const KEY = "pwnit_welcome_seen_session_v1";

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const seen = window.sessionStorage.getItem(KEY);
      if (!seen) setOpen(true);
    } catch {
      // ignore
    }
  }, []);

  function dismiss() {
    setOpen(false);
    try {
      window.sessionStorage.setItem(KEY, "1");
    } catch {}
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
        <div className="text-2xl font-extrabold tracking-tight text-slate-900">PwnIt</div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
            <div className="text-xs font-black text-slate-500">1</div>
            <div className="mt-1 text-sm font-extrabold text-slate-900">Pick a prize</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
            <div className="text-xs font-black text-slate-500">2</div>
            <div className="mt-1 text-sm font-extrabold text-slate-900">Play a skill game</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
            <div className="text-xs font-black text-slate-500">3</div>
            <div className="mt-1 text-sm font-extrabold text-slate-900">Win</div>
          </div>
        </div>

        <p className="mt-3 text-sm text-slate-700">Or buy it if you don&apos;t.</p>

        <div className="mt-4 flex items-center justify-end">
          <button
            onClick={dismiss}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800"
          >
            Start
          </button>
        </div>
      </div>
    </div>
  );
}
