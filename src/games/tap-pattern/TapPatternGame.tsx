"use client";

import { useMemo, useState } from "react";

export default function TapPatternGame({ onFinish, disabled }: any) {
  const pattern = useMemo(() => ["L", "R", "L", "L"], []);
  const [idx, setIdx] = useState(0);

  function tap(side: string) {
    if (disabled) return;

    if (side === pattern[idx]) {
      if (idx === pattern.length - 1) {
        onFinish({ scoreMs: 0 });
        setIdx(0);
      } else setIdx((v) => v + 1);
    } else {
      onFinish({ scoreMs: 500 });
      setIdx(0);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Objective</div>
        <div className="mt-1 text-sm font-semibold text-slate-700">Follow the pattern in order: {pattern.join(" • ")}</div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Progress</div>
        <div className="mt-3 flex gap-2">
          {pattern.map((step, i) => (
            <div
              key={`${step}-${i}`}
              className={[
                "flex-1 rounded-2xl px-3 py-4 text-center text-sm font-black",
                i < idx ? "bg-emerald-100 text-emerald-800" : i === idx ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500",
              ].join(" ")}
            >
              {step}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => tap("L")}
          className="rounded-[28px] bg-slate-900 px-6 py-6 text-xl font-black text-white shadow-sm transition hover:-translate-y-0.5"
          disabled={disabled}
        >
          Left
        </button>
        <button
          onClick={() => tap("R")}
          className="rounded-[28px] bg-slate-900 px-6 py-6 text-xl font-black text-white shadow-sm transition hover:-translate-y-0.5"
          disabled={disabled}
        >
          Right
        </button>
      </div>
    </div>
  );
}
