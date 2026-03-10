"use client";

import { useEffect, useRef, useState } from "react";
import type { GameProps } from "../types";

const ROUNDS = 3;

function triangle(t: number) {
  const cycle = t % 2;
  return cycle <= 1 ? cycle : 2 - cycle;
}

export default function QuickStopGame({ onFinish, disabled }: GameProps) {
  const [phase, setPhase] = useState<"IDLE" | "RUNNING" | "PAUSED" | "DONE">("IDLE");
  const [round, setRound] = useState(1);
  const [position, setPosition] = useState(0.5);
  const [totalScore, setTotalScore] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const roundStartRef = useRef(0);
  const totalRef = useRef(0);
  const speedRef = useRef(0.75);
  const seedRef = useRef(Math.random());
  const positionRef = useRef(0.5);

  function cleanup() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  useEffect(() => cleanup, []);

  function startAnimation() {
    cleanup();
    timerRef.current = setInterval(() => {
      const elapsed = (performance.now() - roundStartRef.current) / 1000;
      const pos = triangle(elapsed * speedRef.current + seedRef.current);
      positionRef.current = pos;
      setPosition(pos);
    }, 16);
  }

  function startRound(nextRound = 1) {
    speedRef.current = 0.65 + Math.random() * 0.9;
    seedRef.current = Math.random();
    roundStartRef.current = performance.now();
    positionRef.current = 0.5;
    setRound(nextRound);
    setPosition(0.5);
    setPhase("RUNNING");
    startAnimation();
  }

  function begin() {
    if (disabled) return;
    totalRef.current = 0;
    setTotalScore(null);
    startRound(1);
  }

  function stopNow() {
    if (disabled || phase !== "RUNNING") return;
    const error = Math.abs(positionRef.current - 0.5);
    const roundScore = Math.round(error * 10_000);
    const nextTotal = totalRef.current + roundScore;
    totalRef.current = nextTotal;
    cleanup();

    if (round >= ROUNDS) {
      setTotalScore(nextTotal);
      setPhase("DONE");
      onFinish({ scoreMs: nextTotal, meta: { game: "quick-stop", rounds: ROUNDS } });
      return;
    }

    setPhase("PAUSED");
    setTimeout(() => startRound(round + 1), 420);
  }

  return (
    <div className="space-y-3 sm:space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 sm:text-xs">Quick Stop</div>
          <div className="mt-1 text-sm font-semibold text-slate-700">Stop the moving slider as close to the centre marker as you can over three rounds.</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-right shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Round</div>
          <div className="mt-0.5 text-lg font-black tabular-nums text-slate-900">{Math.min(round, ROUNDS)} / {ROUNDS}</div>
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
          <span>Stop on the centre line</span>
          <span>Lower score is better</span>
        </div>
        <div className="relative mt-4 h-7 overflow-hidden rounded-full bg-slate-100 sm:mt-5 sm:h-8">
          <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-emerald-500" />
          <div
            className="absolute top-1/2 h-5 w-9 -translate-y-1/2 rounded-full bg-slate-900 shadow-sm sm:h-6 sm:w-10"
            style={{ left: `calc(${position * 100}% - 18px)` }}
          />
        </div>
      </div>

      {phase === "DONE" && totalScore != null ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">Run complete • Score <span className="font-black text-slate-900">{totalScore}</span></div>
      ) : null}

      <button
        className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-50"
        onClick={phase === "RUNNING" ? stopNow : begin}
        disabled={!!disabled}
      >
        {phase === "RUNNING" ? "Stop now" : phase === "DONE" ? "Play again" : "Start quick stop"}
      </button>
    </div>
  );
}
