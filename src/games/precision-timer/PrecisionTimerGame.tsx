"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "../types";

export default function PrecisionTimerGame({ onFinish, disabled }: GameProps) {
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
    onFinish({ scoreMs: error, meta: { stoppedAtMs: ms, targetMs: TARGET_MS } });
  };

  return (
    <div className="grid gap-3">
      <div className="text-sm font-extrabold text-slate-900">Precision Timer</div>
      <div className="text-xs text-slate-600">
        Stop at exactly <span className="font-semibold text-slate-900">{(TARGET_MS / 1000).toFixed(3)}s</span>.
        Score = error in ms (lower is better).
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-center">
        <div className="text-4xl font-extrabold tabular-nums text-slate-900">
          {(elapsed / 1000).toFixed(3)}s
        </div>
        <div className="mt-1 text-[11px] font-semibold text-slate-500">
          Target: {(TARGET_MS / 1000).toFixed(3)}s
        </div>
      </div>

      <div className="flex gap-2">
        {!running ? (
          <button
            onClick={start}
            disabled={disabled}
            className={[
              "inline-flex flex-1 items-center justify-center rounded-xl px-4 py-3 text-sm font-extrabold",
              disabled
                ? "bg-slate-200 text-slate-500"
                : "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.99]",
            ].join(" ")}
          >
            Start
          </button>
        ) : (
          <button
            onClick={stop}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-extrabold text-slate-900 hover:bg-slate-50 active:scale-[0.99]"
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
}