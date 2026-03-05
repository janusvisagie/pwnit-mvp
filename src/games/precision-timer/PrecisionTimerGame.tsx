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

  return (
    <div className="space-y-3">
      <div className="text-sm font-extrabold text-slate-900">Precision Timer</div>
      <div className="text-xs text-slate-700">
        Stop at exactly {(TARGET_MS / 1000).toFixed(3)}s. Score = error in ms (lower is better).
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
        <div className="text-4xl font-black tabular-nums text-slate-900">
          {(elapsed / 1000).toFixed(3)}s
        </div>
        <div className="mt-1 text-xs font-semibold text-slate-600">
          Target: {(TARGET_MS / 1000).toFixed(3)}s
        </div>
      </div>

      {!running ? (
        <button
          className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white disabled:opacity-50"
          onClick={start}
          disabled={!!disabled}
        >
          Start
        </button>
      ) : (
        <button
          className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white disabled:opacity-50"
          onClick={stop}
          disabled={!!disabled}
        >
          Stop
        </button>
      )}
    </div>
  );
}
