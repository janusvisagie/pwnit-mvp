"use client";

import { useMemo, useRef, useState } from "react";
import type { GameProps } from "../types";

const BURSTS = 10;
const OPTIONS = [
  { key: "A", label: "Top left" },
  { key: "B", label: "Top right" },
  { key: "C", label: "Bottom left" },
  { key: "D", label: "Bottom right" },
] as const;

export default function BurstMatchGame({ onFinish, disabled }: GameProps) {
  const sequence = useMemo(() => Array.from({ length: BURSTS }, () => OPTIONS[Math.floor(Math.random() * OPTIONS.length)].key), []);
  const [phase, setPhase] = useState<"IDLE" | "RUNNING" | "DONE">("IDLE");
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>(sequence[0]);
  const startedAtRef = useRef(0);
  const totalRef = useRef(0);

  function begin() {
    if (disabled) return;
    totalRef.current = 0;
    setIndex(0);
    setPrompt(sequence[0]);
    setScore(null);
    setActive(null);
    startedAtRef.current = performance.now();
    setPhase("RUNNING");
  }

  function handleTap(key: string) {
    if (disabled || phase !== "RUNNING") return;
    const now = performance.now();
    const reaction = Math.round(now - startedAtRef.current);
    const correct = key === prompt;
    totalRef.current += reaction + (correct ? 0 : 900);
    setActive(correct ? key : prompt);

    const nextIndex = index + 1;
    if (nextIndex >= BURSTS) {
      const finalScore = totalRef.current;
      setScore(finalScore);
      setPhase("DONE");
      onFinish({ scoreMs: finalScore, meta: { game: "burst-match", bursts: BURSTS } });
      return;
    }

    setTimeout(() => {
      setIndex(nextIndex);
      setPrompt(sequence[nextIndex]);
      setActive(null);
      startedAtRef.current = performance.now();
    }, 180);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Burst Match</div>
          <div className="mt-1 text-sm font-semibold text-slate-700">Hit the named tile as quickly and accurately as you can across ten bursts.</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Burst</div>
          <div className="mt-1 text-xl font-black tabular-nums text-slate-900">{phase === "IDLE" ? 0 : Math.min(index + 1, BURSTS)} / {BURSTS}</div>
        </div>
      </div>

      {phase !== "IDLE" ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Target</div>
          <div className="mt-2 text-3xl font-black tracking-tight text-slate-900">{OPTIONS.find((o) => o.key === prompt)?.label}</div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map((option) => {
          const on = active === option.key || prompt === option.key;
          return (
            <button
              key={option.key}
              onClick={() => handleTap(option.key)}
              disabled={disabled || phase !== "RUNNING"}
              className={[
                "rounded-[28px] px-5 py-8 text-base font-black shadow-sm transition",
                phase !== "RUNNING"
                  ? "bg-slate-100 text-slate-400"
                  : on
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-900 ring-1 ring-slate-200 hover:-translate-y-0.5 hover:bg-slate-50",
              ].join(" ")}
            >
              {option.label}
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
        {phase === "DONE" ? "Play again" : "Start burst match"}
      </button>
    </div>
  );
}
