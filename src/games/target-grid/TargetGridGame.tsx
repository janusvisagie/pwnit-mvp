"use client";

import { useMemo, useRef, useState } from "react";
import type { GameProps } from "../types";

const TURNS = 6;

export default function TargetGridGame({ onFinish, disabled }: GameProps) {
  const targets = useMemo(() => Array.from({ length: TURNS }, () => Math.floor(Math.random() * 9)), []);
  const [phase, setPhase] = useState<"IDLE" | "RUNNING" | "DONE">("IDLE");
  const [turn, setTurn] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [flash, setFlash] = useState<number | null>(null);
  const startedAtRef = useRef(0);
  const totalRef = useRef(0);

  function begin() {
    if (disabled) return;
    totalRef.current = 0;
    setTurn(0);
    setScore(null);
    setFlash(null);
    startedAtRef.current = performance.now();
    setPhase("RUNNING");
  }

  function select(cell: number) {
    if (disabled || phase !== "RUNNING") return;
    const reaction = Math.round(performance.now() - startedAtRef.current);
    const target = targets[turn];
    const correct = cell === target;

    totalRef.current += reaction + (correct ? 0 : 600);
    setFlash(correct ? cell : target);

    const nextTurn = turn + 1;
    if (nextTurn >= TURNS) {
      const finalScore = totalRef.current;
      setScore(finalScore);
      setPhase("DONE");
      onFinish({ scoreMs: finalScore, meta: { game: "target-grid", turns: TURNS } });
      return;
    }

    setTimeout(() => {
      setTurn(nextTurn);
      setFlash(null);
      startedAtRef.current = performance.now();
    }, 120);
  }

  const currentTarget = targets[turn] ?? 0;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-black text-slate-900">Target Grid</h3>
        <p className="mt-1 text-sm text-slate-600">Hit the highlighted square over six quick turns.</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">
        Turn <span className="font-black text-slate-900">{phase === "IDLE" ? 0 : Math.min(turn + 1, TURNS)}</span> / {TURNS}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_, idx) => {
          const active = phase === "RUNNING" && currentTarget === idx;
          const flashed = flash === idx;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => select(idx)}
              disabled={disabled || phase !== "RUNNING"}
              className={[
                "aspect-square rounded-2xl text-sm font-black shadow-sm transition sm:text-base",
                phase !== "RUNNING"
                  ? "bg-slate-100 text-slate-400"
                  : flashed
                    ? "bg-slate-900 text-white"
                    : active
                      ? "bg-emerald-100 text-emerald-800 ring-2 ring-emerald-300"
                      : "bg-white text-slate-900 ring-1 ring-slate-200 hover:-translate-y-0.5 hover:bg-slate-50",
              ].join(" ")}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {phase === "DONE" && score != null ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700">
          Score <span className="font-black text-slate-900">{score}</span>
        </div>
      ) : null}

      <button
        type="button"
        onClick={begin}
        disabled={disabled}
        className="rounded-full bg-slate-900 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {phase === "DONE" ? "Play again" : "Start target grid"}
      </button>
    </div>
  );
}
