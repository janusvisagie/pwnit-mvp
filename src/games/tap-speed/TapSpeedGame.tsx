"use client";

import { useEffect, useRef, useState } from "react";

const ROUND_MS = 5000;

export default function TapSpeedGame(props: any) {
  const { onFinish, onResult, disabled } = props ?? {};
  const finish = typeof onFinish === "function" ? onFinish : typeof onResult === "function" ? onResult : null;

  const [phase, setPhase] = useState<"idle" | "countdown" | "live" | "done">("idle");
  const [timeLeft, setTimeLeft] = useState(ROUND_MS);
  const [taps, setTaps] = useState(0);
  const startedAt = useRef<number | null>(null);

  function begin() {
    if (disabled) return;
    setPhase("countdown");
    setTaps(0);
    setTimeLeft(ROUND_MS);
    setTimeout(() => {
      startedAt.current = Date.now();
      setPhase("live");
    }, 900);
  }

  useEffect(() => {
    if (phase !== "live") return;
    const id = setInterval(() => {
      const elapsed = Date.now() - (startedAt.current ?? Date.now());
      const remaining = Math.max(0, ROUND_MS - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        setPhase("done");
        finish?.({ scoreMs: taps, meta: { taps, roundMs: ROUND_MS } });
      }
    }, 50);
    return () => clearInterval(id);
  }, [phase, taps, finish]);

  function tap() {
    if (phase === "live") setTaps((v) => v + 1);
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Objective</div>
        <div className="mt-1 text-sm font-semibold text-slate-700">Tap as many times as possible in five seconds. More taps means a stronger score.</div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm text-center">
        <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Tap Rush</div>
        <div className="mt-4 text-5xl font-black tracking-tight text-slate-900">{taps}</div>
        <div className="mt-2 text-sm font-semibold text-slate-600">
          {phase === "idle" ? "Press start when you’re ready." : phase === "countdown" ? "Get ready…" : phase === "live" ? `${Math.ceil(timeLeft / 1000)}s left` : "Round complete"}
        </div>

        {phase === "idle" || phase === "done" ? (
          <button
            className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
            onClick={begin}
            disabled={!!disabled}
          >
            {phase === "done" ? "Play again" : "Start run"}
          </button>
        ) : (
          <button
            className={[
              "mt-6 w-full rounded-[24px] px-4 py-10 text-3xl font-black tracking-tight shadow-sm transition",
              phase === "live" ? "bg-slate-900 text-white hover:scale-[1.01]" : "bg-slate-200 text-slate-500",
            ].join(" ")}
            onClick={tap}
            disabled={phase !== "live" || !!disabled}
          >
            TAP
          </button>
        )}
      </div>
    </div>
  );
}
