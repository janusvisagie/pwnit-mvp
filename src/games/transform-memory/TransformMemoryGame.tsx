"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { GameProps } from "../types";

const GRID_SIZE = 4;
const ACTIVE_COUNT = 5;
const SHOW_MS = 2200;
const MAX_SCORE = 24000;

type TransformRule = {
  id: string;
  label: string;
  apply: (cells: number[]) => number[];
};

const RULES: TransformRule[] = [
  {
    id: "rotate-right",
    label: "Rotate the pattern 90° clockwise.",
    apply: (cells) => cells.map((cell) => {
      const x = cell % GRID_SIZE;
      const y = Math.floor(cell / GRID_SIZE);
      return x * GRID_SIZE + (GRID_SIZE - 1 - y);
    }),
  },
  {
    id: "mirror-horizontal",
    label: "Mirror the pattern left to right.",
    apply: (cells) => cells.map((cell) => {
      const x = cell % GRID_SIZE;
      const y = Math.floor(cell / GRID_SIZE);
      return y * GRID_SIZE + (GRID_SIZE - 1 - x);
    }),
  },
  {
    id: "mirror-vertical",
    label: "Mirror the pattern top to bottom.",
    apply: (cells) => cells.map((cell) => {
      const x = cell % GRID_SIZE;
      const y = Math.floor(cell / GRID_SIZE);
      return (GRID_SIZE - 1 - y) * GRID_SIZE + x;
    }),
  },
];

function shuffle<T>(values: readonly T[]) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function buildPattern() {
  return shuffle(Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => index)).slice(0, ACTIVE_COUNT).sort((a, b) => a - b);
}

function sameSet(a: number[], b: number[]) {
  if (a.length !== b.length) return false;
  const left = [...a].sort((x, y) => x - y);
  const right = [...b].sort((x, y) => x - y);
  return left.every((value, index) => value === right[index]);
}

export default function TransformMemoryGame({ onFinish, disabled }: GameProps) {
  const basePattern = useMemo(() => buildPattern(), []);
  const rule = useMemo(() => RULES[Math.floor(Math.random() * RULES.length)]!, []);
  const targetPattern = useMemo(() => rule.apply(basePattern).sort((a, b) => a - b), [basePattern, rule]);

  const [phase, setPhase] = useState<"READY" | "SHOW" | "INPUT" | "DONE">("READY");
  const [selected, setSelected] = useState<number[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (phase !== "SHOW") return undefined;
    const timer = window.setTimeout(() => {
      setPhase("INPUT");
      startedAtRef.current = Date.now();
      setMessage("Now rebuild the transformed pattern.");
    }, SHOW_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  function start() {
    if (disabled) return;
    setPhase("SHOW");
    setSelected([]);
    setScore(null);
    setMessage(rule.label);
    startedAtRef.current = null;
  }

  function toggleCell(cell: number) {
    if (disabled || phase !== "INPUT") return;
    setSelected((current) =>
      current.includes(cell) ? current.filter((value) => value !== cell) : [...current, cell].slice(0, ACTIVE_COUNT),
    );
  }

  function submit() {
    if (disabled || phase !== "INPUT" || selected.length !== ACTIVE_COUNT) return;
    const elapsedMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));
    const correct = sameSet(selected, targetPattern);
    const finalScore = correct ? Math.max(1200, MAX_SCORE - elapsedMs) : 0;

    setPhase("DONE");
    setScore(finalScore);
    setMessage(correct ? "Pattern transformed correctly." : "Not quite.");

    onFinish({
      scoreMs: finalScore,
      meta: {
        game: "transform-memory",
        rule: rule.id,
        basePattern,
        selected,
        correct,
        elapsedMs,
      },
    });
  }

  function visibleCells() {
    if (phase === "SHOW") return basePattern;
    return selected;
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Objective</div>
          <h3 className="mt-1 text-lg font-black text-slate-950">Transform Memory</h3>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">Pick {ACTIVE_COUNT} cells</div>
      </div>

      <p className="mt-3 text-sm text-slate-600">Memorise the pattern, apply the rule, then rebuild the transformed version from memory.</p>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <div className="font-semibold text-slate-900">Rule</div>
        <div className="mt-1">{rule.label}</div>
        {message ? <div className="mt-2">{message}</div> : null}
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, cell) => {
          const active = visibleCells().includes(cell);
          return (
            <button
              key={cell}
              type="button"
              onClick={() => toggleCell(cell)}
              disabled={disabled || phase !== "INPUT"}
              className={[
                "aspect-square rounded-2xl border transition",
                active
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-300",
                phase === "INPUT" ? "hover:-translate-y-0.5 hover:border-slate-400" : "cursor-default",
              ].join(" ")}
            >
              <span className="sr-only">Cell {cell + 1}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={start}
          disabled={disabled}
          className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {phase === "READY" ? "Start transform memory" : "Restart"}
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={disabled || phase !== "INPUT" || selected.length !== ACTIVE_COUNT}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          Submit pattern
        </button>
      </div>

      {score != null ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
          Score {score.toLocaleString("en-ZA")}
        </div>
      ) : null}
    </div>
  );
}
