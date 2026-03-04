"use client";

import { useRef, useState } from "react";
import type { GameProps } from "../types";

export default function RhythmHoldGame({ onFinish, disabled }: GameProps) {
  const TARGET_MS = 700;

  const [holding, setHolding] = useState(false);
  const downAt = useRef<number | null>(null);

  const onDown = () => {
    if (disabled) return;
    downAt.current = Date.now();
    setHolding(true);
  };

  const onUp = () => {
    if (!holding || downAt.current == null) return;
    const held = Date.now() - downAt.current;
    setHolding(false);
    const error = Math.abs(held - TARGET_MS);
    onFinish({ scoreMs: error, meta: { heldMs: held, targetMs: TARGET_MS } });
  };

  return (
    <div className="grid gap-3">
      <div className="text-sm font-extrabold text-slate-900">Rhythm Hold</div>
      <div className="text-xs text-slate-600">
        Hold for <span className="font-semibold text-slate-900">{TARGET_MS}ms</span>. Score = error in ms.
      </div>

      <button
        onMouseDown={onDown}
        onMouseUp={onUp}
        onTouchStart={onDown}
        onTouchEnd={onUp}
        disabled={disabled}
        className={[
          "rounded-2xl px-4 py-5 text-center text-base font-extrabold",
          "select-none",
          disabled
            ? "bg-slate-200 text-slate-500"
            : holding
              ? "bg-slate-900 text-white active:scale-[0.99]"
              : "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.99]",
        ].join(" ")}
      >
        {holding ? "Release now" : "Hold"}
      </button>

      <div className="text-[11px] font-semibold text-slate-500">
        Tip: release cleanly — don’t drag.
      </div>
    </div>
  );
}
