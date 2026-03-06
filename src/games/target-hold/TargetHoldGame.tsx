"use client";

import { useRef, useState } from "react";

export default function TargetHoldGame({ onFinish, disabled }: any) {
  const TARGET = 1500;
  const start = useRef<number | null>(null);
  const [holding, setHolding] = useState(false);
  const [heldMs, setHeldMs] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  function down() {
    if (disabled) return;
    start.current = Date.now();
    setHeldMs(0);
    setHolding(true);
    intervalRef.current = setInterval(() => {
      if (start.current != null) setHeldMs(Date.now() - start.current);
    }, 16);
  }

  function up() {
    if (!holding || start.current == null) return;
    const ms = Date.now() - start.current;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    onFinish({ scoreMs: Math.abs(ms - TARGET) });
    setHolding(false);
  }

  const progress = Math.min(100, (heldMs / TARGET) * 100);

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Objective</div>
        <div className="mt-1 text-sm font-semibold text-slate-700">Hold for exactly 1.5 seconds, then release.</div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>Hold progress</span>
          <span>{heldMs}ms / {TARGET}ms</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 transition-[width] duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <button
        onMouseDown={down}
        onMouseUp={up}
        onMouseLeave={holding ? up : undefined}
        onTouchStart={down}
        onTouchEnd={up}
        disabled={disabled}
        className={[
          "w-full rounded-[28px] px-5 py-6 text-base font-black shadow-sm transition",
          disabled
            ? "cursor-not-allowed bg-slate-200 text-slate-500"
            : holding
              ? "scale-[0.99] bg-slate-900 text-white"
              : "bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white hover:-translate-y-0.5",
        ].join(" ")}
      >
        {holding ? "Release" : "Press and hold"}
      </button>
    </div>
  );
}
