"use client";

import { useMemo, useRef, useState } from "react";

import type { GameProps } from "../types";

type Challenge = {
  game?: "route-builder";
  path: number[];
  checkpoints: number[];
  blockers: number[];
};

const GRID_SIZE = 6;
const MAX_SCORE = 26000;
const PATH_TEMPLATES: number[][] = [
  [0, 1, 2, 8, 14, 15, 16, 22, 28, 29, 35],
  [0, 6, 12, 13, 14, 20, 26, 27, 28, 34, 35],
  [0, 1, 7, 13, 19, 20, 21, 22, 28, 34, 35],
  [0, 6, 7, 8, 14, 20, 26, 32, 33, 34, 35],
  [0, 1, 2, 3, 9, 15, 21, 27, 28, 29, 35],
  [0, 6, 12, 18, 19, 20, 26, 32, 33, 34, 35],
];

function sample<T>(values: readonly T[]): T {
  return values[Math.floor(Math.random() * values.length)]!;
}

function shuffled<T>(values: readonly T[]): T[] {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function buildChallenge(): Challenge {
  const path = sample(PATH_TEMPLATES);
  const blockers = shuffled(
    Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => index).filter((cell) => !path.includes(cell)),
  ).slice(0, 10);

  return {
    game: "route-builder",
    path,
    checkpoints: [path[2]!, path[5]!, path[8]!],
    blockers,
  };
}

function isAdjacent(a: number, b: number) {
  const ax = a % GRID_SIZE;
  const ay = Math.floor(a / GRID_SIZE);
  const bx = b % GRID_SIZE;
  const by = Math.floor(b / GRID_SIZE);
  return Math.abs(ax - bx) + Math.abs(ay - by) === 1;
}

export default function RouteBuilderGame({ onFinish, disabled, challenge: injectedChallenge }: GameProps<Challenge>) {
  const challenge = useMemo(() => injectedChallenge ?? buildChallenge(), [injectedChallenge]);
  const [phase, setPhase] = useState<"READY" | "RUNNING" | "DONE">("READY");
  const [trail, setTrail] = useState<number[]>([challenge.path[0]!]);
  const [mistakes, setMistakes] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const clickLogRef = useRef<number[]>([]);

  const start = challenge.path[0]!;
  const finish = challenge.path[challenge.path.length - 1]!;

  function reset() {
    setPhase("RUNNING");
    setTrail([start]);
    setMistakes(0);
    setMessage("Follow the route, clear all three checkpoints, and reach F. Crosses are blocked and cannot be used.");
    setScore(null);
    startedAtRef.current = Date.now();
    clickLogRef.current = [];
  }

  function complete(finalTrail: number[], finalMistakes: number) {
    const elapsedMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));
    const extraSteps = Math.max(0, finalTrail.length - challenge.path.length);
    const computed = Math.max(1000, MAX_SCORE - elapsedMs - finalMistakes * 700 - extraSteps * 320);

    setPhase("DONE");
    setScore(computed);
    setMessage(`Solved in ${(elapsedMs / 1000).toFixed(1)}s.`);

    onFinish({
      scoreMs: computed,
      meta: {
        game: "route-builder",
        elapsedMs,
        clickLog: clickLogRef.current,
      },
    });
  }

  function handleCell(cell: number) {
    if (disabled || phase !== "RUNNING") return;
    clickLogRef.current.push(cell);

    if (challenge.blockers.includes(cell)) {
      setMistakes((current) => current + 1);
      setMessage("Crosses are blocked tiles and cannot be used.");
      return;
    }

    const current = trail[trail.length - 1]!;
    if (cell === current) return;

    if (trail.length > 1 && cell === trail[trail.length - 2]) {
      const nextTrail = trail.slice(0, -1);
      setTrail(nextTrail);
      setMessage("Backtracked one step.");
      return;
    }

    if (!isAdjacent(current, cell)) {
      setMistakes((value) => value + 1);
      setMessage("Use neighbouring tiles only.");
      return;
    }

    const nextTrail = [...trail, cell];
    setTrail(nextTrail);
    setMessage(null);

    const checkpointsCleared = challenge.checkpoints.every((checkpoint) => nextTrail.includes(checkpoint));
    if (cell === finish && checkpointsCleared) {
      complete(nextTrail, mistakes);
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objective</div>
          <h3 className="mt-1 text-base font-black text-slate-950 sm:text-lg">Route Builder</h3>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          Checkpoints {trail.filter((cell) => challenge.checkpoints.includes(cell)).length} / {challenge.checkpoints.length}
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        Build a clean route from <span className="font-bold text-slate-900">S</span> to <span className="font-bold text-slate-900">F</span>, pass every checkpoint, and avoid the <span className="font-bold text-slate-900">×</span> blocked tiles.
      </p>

      <div className="mx-auto mt-3 grid max-w-[17rem] grid-cols-6 gap-1.5 sm:gap-2">
        {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, cell) => {
          const isStart = cell === start;
          const isFinish = cell === finish;
          const isCheckpoint = challenge.checkpoints.includes(cell);
          const isBlocked = challenge.blockers.includes(cell);
          const isOnTrail = trail.includes(cell);
          const label = isStart ? "S" : isFinish ? "F" : isCheckpoint ? "C" : "";

          return (
            <button
              key={cell}
              type="button"
              onClick={() => handleCell(cell)}
              disabled={disabled || phase !== "RUNNING"}
              className={[
                "aspect-square rounded-xl border text-[10px] font-black transition sm:text-xs",
                isBlocked
                  ? "cursor-not-allowed border-slate-200 bg-slate-200 text-slate-400"
                  : isOnTrail
                    ? "border-slate-900 bg-slate-900 text-white"
                    : isStart || isFinish
                      ? "border-indigo-300 bg-indigo-50 text-indigo-900"
                      : isCheckpoint
                        ? "border-amber-300 bg-amber-50 text-amber-900"
                        : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-slate-300",
              ].join(" ")}
            >
              {isBlocked ? "×" : label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <div className="font-semibold text-slate-900">How it works</div>
        <div className="mt-1">Crosses are blocked and cannot be used. This version is longer and denser, so fast solves, few mistakes, and short routes separate scores more clearly.</div>
        <div className="mt-1">Mistakes: {mistakes}</div>
        {message ? <div className="mt-1">{message}</div> : null}
        {score != null ? <div className="mt-2 font-black text-emerald-700">Score {score.toLocaleString("en-ZA")}</div> : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={reset}
          disabled={disabled}
          className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {phase === "READY" ? "Start Route Builder" : phase === "DONE" ? "Play again" : "Restart run"}
        </button>
        {phase === "RUNNING" ? <div className="self-center text-sm text-slate-500">Tap the previous tile to backtrack.</div> : null}
      </div>
    </div>
  );
}
