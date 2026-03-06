"use client";

import { useEffect, useState } from "react";

export default function StopZeroGame({ onFinish, disabled }: any) {
  const [time, setTime] = useState(3000);
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (!run) return;
    const i = setInterval(() => setTime((t) => t - 16), 16);
    return () => clearInterval(i);
  }, [run]);

  function start() {
    if (disabled) return;
    setTime(3000);
    setRun(true);
  }

  function stop() {
    setRun(false);
    onFinish({ scoreMs: Math.abs(time) });
  }

  const progress = Math.max(0, Math.min(100, (time / 3000) * 100));

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Objective</div>
        <div className="mt-1 text-sm font-semibold text-slate-700">Start at 3.00 and stop as close to 0.00 as possible.</div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-center text-white shadow-sm">
        <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Countdown</div>
        <div className="mt-4 text-5xl font-black tabular-nums tracking-tight sm:text-6xl">{(time / 1000).toFixed(2)}</div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-500 transition-[width] duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <button
        onClick={run ? stop : start}
        className={[
          "w-full rounded-2xl px-4 py-3 text-sm font-extrabold text-white shadow-sm transition",
          run ? "bg-emerald-600 hover:-translate-y-0.5 hover:bg-emerald-500" : "bg-slate-900 hover:-translate-y-0.5 hover:bg-slate-800",
        ].join(" ")}
        disabled={disabled}
      >
        {run ? "Stop at zero" : "Start countdown"}
      </button>
    </div>
  );
}
