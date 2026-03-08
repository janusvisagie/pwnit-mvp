"use client";

import { useMemo, useRef, useState } from "react";
import type { GameProps } from "../types";

const TURNS = 12;

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
    totalRef.current += reaction + (correct ? 0 : 750);
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
    }, 180);
  }

  const currentTarget = targets[turn] ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Target Grid</div>
          <div className="mt-1 text-sm font-semibold text-slate-700">Tap the highlighted cell over twelve quick turns. Wrong taps add penalties.</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Turn</div>
          <div className="mt-1 text-xl font-black tabular-nums text-slate-900">{phase === "IDLE" ? 0 : Math.min(turn + 1, TURNS)} / {TURNS}</div>
        </div>
      </div>

      {phase !== "IDLE" ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Target cell</div>
          <div className="mt-2 text-3xl font-black tracking-tight text-slate-900">{currentTarget + 1}</div>
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_, idx) => {
          const active = phase === "RUNNING" && currentTarget === idx;
          const flashed = flash === idx;
          return (
            <button
              key={idx}
              onClick={() => select(idx)}
              disabled={disabled || phase !== "RUNNING"}
              className={[
                "aspect-square rounded-[24px] text-lg font-black shadow-sm transition",
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
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">Run complete • Score <span className="font-black text-slate-900">{score}</span></div>
      ) : null}

      <button
        className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:opacity-50"
        onClick={begin}
        disabled={!!disabled || phase === "RUNNING"}
      >
        {phase === "DONE" ? "Play again" : "Start target grid"}
      </button>
    </div>
  );
}
