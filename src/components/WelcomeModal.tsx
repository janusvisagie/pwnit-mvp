// src/components/WelcomeModal.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "pwnit_welcome_seen_session_v1_1";

type Me = {
  dailyFreeCredits?: number;
  totalCredits?: number;
};

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<Me>({});

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

    // Best-effort fetch for the daily credits number (optional)
    (async () => {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) return;
        const data: any = await res.json();
        setMe({
          dailyFreeCredits: Number(data?.dailyFreeCredits),
          totalCredits: Number(data?.totalCredits),
        });
      } catch {
        // ignore
      }
    })();
  }, []);

  function dismiss() {
    setOpen(false);
  }

  if (!open) return null;

  const daily = Number.isFinite(me.dailyFreeCredits as any) ? me.dailyFreeCredits : 50;
  const total = Number.isFinite(me.totalCredits as any) ? me.totalCredits : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-slate-600">Welcome to</div>
            <div className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
              PwnIt <span className="text-base">👋</span>
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Pick a prize → play a quick skill game → win it. If you don’t win, you can still buy it with credits.
            </div>
          </div>

          <button
            onClick={dismiss}
            className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Got it
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="text-xs font-extrabold text-slate-900">1) Play</div>
            <div className="mt-1 text-sm text-slate-600">Choose a prize and spend credits to enter.</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="text-xs font-extrabold text-slate-900">2) Win</div>
            <div className="mt-1 text-sm text-slate-600">Best times rank highest when the timer ends.</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="text-xs font-extrabold text-slate-900">3) Buy</div>
            <div className="mt-1 text-sm text-slate-600">Didn’t win? Buy the prize by paying the difference.</div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
          <div className="font-semibold text-slate-900">Daily free credits</div>
          <div className="mt-1 text-slate-600">
            You get <span className="font-extrabold text-slate-900">{daily}</span> free credits each day.
            {total != null ? (
              <>
                {" "}
                You currently have <span className="font-extrabold text-slate-900">{total}</span> total credits.
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <Link
            href="/buy-credits"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            onClick={dismiss as any}
          >
            Buy credits
          </Link>

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
