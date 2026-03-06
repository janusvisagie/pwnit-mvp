"use client";

import { useRef, useState } from "react";
import type { GameProps } from "../types";

export default function RhythmHoldGame({ onFinish, disabled }: GameProps) {
  const TARGET_MS = 700;
  const [holding, setHolding] = useState(false);
  const [heldMs, setHeldMs] = useState(0);
  const downAt = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const onDown = () => {
    if (disabled) return;
    downAt.current = Date.now();
    setHeldMs(0);
    setHolding(true);
    intervalRef.current = setInterval(() => {
      if (downAt.current != null) setHeldMs(Date.now() - downAt.current);
    }, 16);
  };

  const onUp = () => {
    if (!holding || downAt.current == null) return;
    const held = Date.now() - downAt.current;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setHolding(false);
    const error = Math.abs(held - TARGET_MS);
    onFinish({ scoreMs: error, meta: { heldMs: held, targetMs: TARGET_MS } });
  };

  const progress = Math.min(100, (heldMs / TARGET_MS) * 100);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Objective</div>
          <div className="mt-1 text-sm font-semibold text-slate-700">Hold for exactly {TARGET_MS}ms, then release cleanly.</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Held</div>
          <div className="mt-1 text-xl font-black tabular-nums text-slate-900">{heldMs}ms</div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>Timing bar</span>
          <span>Target {TARGET_MS}ms</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 transition-[width] duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <button
        onMouseDown={onDown}
        onMouseUp={onUp}
        onMouseLeave={holding ? onUp : undefined}
        onTouchStart={onDown}
        onTouchEnd={onUp}
        disabled={disabled}
        className={[
          "w-full rounded-[28px] px-5 py-6 text-base font-black shadow-sm transition",
          disabled
            ? "cursor-not-allowed bg-slate-200 text-slate-500"
            : holding
              ? "scale-[0.99] bg-slate-900 text-white"
              : "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:-translate-y-0.5",
        ].join(" ")}
      >
        {holding ? "Release now" : "Press and hold"}
      </button>
    </div>
  );
}
