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
    <div className="space-y-3">
      <div className="text-sm font-extrabold text-slate-900">Tap Speed</div>
      <div className="text-xs text-slate-700">Tap as soon as it turns green. Lower ms is better.</div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
        {phase === "idle" && (
          <button
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white disabled:opacity-50"
            onClick={begin}
            disabled={!!disabled}
          >
            Start
          </button>
        )}

        {phase === "wait" && <div className="text-sm font-semibold text-slate-700">Wait…</div>}

        {phase === "go" && (
          <button
            className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-extrabold text-white disabled:opacity-50"
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
