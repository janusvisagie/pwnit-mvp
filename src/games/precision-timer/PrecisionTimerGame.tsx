"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "../types";

export default function PrecisionTimerGame(props: GameProps & { onResult?: any }) {
  const { onFinish, disabled } = props as any;
  const onResult = (props as any)?.onResult;

  const finish =
    typeof onFinish === "function"
      ? onFinish
      : typeof onResult === "function"
        ? onResult
        : null;

  const TARGET_MS = 3000;
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startAt = useRef<number | null>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      if (startAt.current == null) return;
      setElapsed(Date.now() - startAt.current);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
  }, [running]);

  const start = () => {
    if (disabled) return;
    startAt.current = Date.now();
    setElapsed(0);
    setRunning(true);
  };

  const stop = () => {
    if (!running || startAt.current == null) return;
    const ms = Date.now() - startAt.current;
    setRunning(false);
    const error = Math.abs(ms - TARGET_MS);
    if (finish) finish({ scoreMs: error, meta: { stoppedAtMs: ms, targetMs: TARGET_MS } });
  };

  const progress = Math.min(100, (elapsed / TARGET_MS) * 100);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Objective</div>
          <div className="mt-1 text-sm font-semibold text-slate-700">
            Stop as close as possible to exactly {(TARGET_MS / 1000).toFixed(3)} seconds.
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Target</div>
          <div className="mt-1 text-xl font-black tabular-nums text-slate-900">3.000s</div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-center text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Live timer</div>
        <div className="mt-4 text-5xl font-black tabular-nums tracking-tight sm:text-6xl">
          {(elapsed / 1000).toFixed(3)}
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <button
        className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={running ? stop : start}
        disabled={!!disabled}
      >
        {running ? "Stop timer" : "Start timer"}
      </button>
    </div>
  );
}
