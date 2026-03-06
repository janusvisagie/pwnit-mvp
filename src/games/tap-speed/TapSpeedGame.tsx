"use client";

import { useState } from "react";

export default function TapSpeedGame(props: any) {
  const { onFinish, onResult, disabled } = props ?? {};
  const finish =
    typeof onFinish === "function"
      ? onFinish
      : typeof onResult === "function"
        ? onResult
        : null;

  const [phase, setPhase] = useState<"idle" | "wait" | "go">("idle");
  const [start, setStart] = useState(0);

  function begin() {
    if (disabled) return;
    setPhase("wait");
    const delay = 800 + Math.random() * 2000;
    setTimeout(() => {
      setStart(Date.now());
      setPhase("go");
    }, delay);
  }

  function tap() {
    if (phase !== "go") return;
    const ms = Date.now() - start;
    if (finish) finish({ scoreMs: ms });
    setPhase("idle");
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Objective</div>
        <div className="mt-1 text-sm font-semibold text-slate-700">Tap the moment the screen flips live. Lower milliseconds wins.</div>
      </div>

      <div
        className={[
          "flex min-h-[280px] items-center justify-center rounded-[28px] border p-5 text-center shadow-sm transition-all",
          phase === "go"
            ? "border-emerald-300 bg-emerald-500 text-white"
            : phase === "wait"
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-slate-200 bg-slate-950 text-white",
        ].join(" ")}
      >
        {phase === "idle" && (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Reaction test</div>
            <div className="mt-4 text-4xl font-black tracking-tight">Ready?</div>
            <button
              className="mt-6 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-slate-900 transition hover:-translate-y-0.5 disabled:opacity-50"
              onClick={begin}
              disabled={!!disabled}
            >
              Start run
            </button>
          </div>
        )}

        {phase === "wait" && (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-amber-700">Hold steady</div>
            <div className="mt-4 text-4xl font-black tracking-tight">Wait…</div>
            <div className="mt-3 text-sm font-semibold text-amber-800">Don’t click early.</div>
          </div>
        )}

        {phase === "go" && (
          <button
            className="w-full rounded-[24px] bg-white px-4 py-8 text-3xl font-black tracking-tight text-emerald-700 shadow-sm transition hover:scale-[1.01] disabled:opacity-50"
            onClick={tap}
            disabled={!!disabled}
          >
            TAP NOW
          </button>
        )}
      </div>
    </div>
  );
}
