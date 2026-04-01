"use client";

import { useMemo, useRef, useState } from "react";
import type { GameProps } from "../types";

type Challenge = {
  game: "route-builder";
  start: number;
  finish: number;
  checkpoints: number[];
  blockers: number[];
  idealLength: number;
};

const GRID_SIZE = 6;
const MAX_SCORE = 12000;

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function shuffle<T>(values: readonly T[]): T[] {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function buildChallenge(): Challenge {
  const templates = [
    [0, 1, 2, 8, 14, 20, 26, 27, 28, 29, 35],
    [6, 7, 13, 19, 20, 21, 22, 23, 29, 35],
    [30, 24, 18, 12, 13, 14, 15, 16, 10, 4, 5],
    [31, 25, 19, 18, 12, 6, 7, 8, 14, 20, 26],
  ];
  const path = templates[randomInt(templates.length)]!;
  const blockers = shuffle(
    Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => index).filter((cell) => !path.includes(cell)),
  ).slice(0, 10);

  return {
    game: "route-builder",
    start: path[0]!,
    finish: path[path.length - 1]!,
    checkpoints: [path[2]!, path[5]!, path[8]!],
    blockers,
    idealLength: path.length,
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
  const [trail, setTrail] = useState<number[]>([challenge.start]);
  const [mistakes, setMistakes] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const clickLogRef = useRef<number[]>([]);
  const mistakesRef = useRef(0);

  function reset() {
    setPhase("RUNNING");
    setTrail([challenge.start]);
    setMistakes(0);
    setMessage("Follow the route from S to F, pass every checkpoint, and avoid blocked tiles.");
    setScore(null);
    startedAtRef.current = Date.now();
    clickLogRef.current = [];
    mistakesRef.current = 0;
  }

  function complete(finalTrail: number[], finalMistakes: number) {
    const elapsedMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));
    const extraSteps = Math.max(0, finalTrail.length - challenge.idealLength);
    const computed = Math.max(1200, MAX_SCORE - elapsedMs - finalMistakes * 700 - extraSteps * 320);
    setPhase("DONE");
    setScore(computed);
    setMessage(`Solved in ${(elapsedMs / 1000).toFixed(1)}s.`);
    onFinish({
      scoreMs: computed,
      meta: {
        game: "route-builder",
        clickLog: clickLogRef.current,
      },
    });
  }

  function handleCell(cell: number) {
    if (disabled || phase !== "RUNNING") return;
    clickLogRef.current = [...clickLogRef.current, cell];

    setTrail((currentTrail) => {
      const current = currentTrail[currentTrail.length - 1]!;
      if (challenge.blockers.includes(cell)) {
        setMistakes((value) => {
          const next = value + 1;
          mistakesRef.current = next;
          return next;
        });
        return currentTrail;
      }
      if (cell === current) return currentTrail;
      if (currentTrail.length > 1 && cell === currentTrail[currentTrail.length - 2]) {
        return currentTrail.slice(0, -1);
      }
      if (!isAdjacent(current, cell)) {
        setMistakes((value) => {
          const next = value + 1;
          mistakesRef.current = next;
          return next;
        });
        return currentTrail;
      }

      const nextTrail = [...currentTrail, cell];
      const reachedAllCheckpoints = challenge.checkpoints.every((checkpoint) => nextTrail.includes(checkpoint));
      if (cell === challenge.finish && reachedAllCheckpoints) {
        const finalMistakes = mistakesRef.current;
        queueMicrotask(() => complete(nextTrail, finalMistakes));
      }
      return nextTrail;
    });
  }

  const checkpointHits = trail.filter((cell) => challenge.checkpoints.includes(cell)).length;

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Route Builder</div>
          <div className="text-lg font-black text-slate-900">Trace a clean path</div>
        </div>
        <button
          type="button"
          onClick={reset}
          disabled={disabled}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {phase === "READY" ? "Start" : "Replay"}
        </button>
      </div>

      <p className="mt-2 text-sm text-slate-600">Build a clean route from <span className="font-bold text-slate-900">S</span> to <span className="font-bold text-slate-900">F</span>, pass every checkpoint, and avoid the blocked tiles.</p>

      <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
        <div>Mistakes: {mistakes}</div>
        <div>Checkpoints: {checkpointHits} / {challenge.checkpoints.length}</div>
        {score !== null ? <div>Score: {score}</div> : null}
      </div>

      <div className="mx-auto mt-4 grid max-w-[17rem] grid-cols-6 gap-1.5 sm:gap-2">
        {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, cell) => {
          const isStart = cell === challenge.start;
          const isFinish = cell === challenge.finish;
          const isCheckpoint = challenge.checkpoints.includes(cell);
          const isBlocked = challenge.blockers.includes(cell);
          const isOnTrail = trail.includes(cell);
          const label = isStart ? "S" : isFinish ? "F" : isCheckpoint ? "C" : isBlocked ? "×" : "";

          return (
            <button
              key={cell}
              type="button"
              onClick={() => handleCell(cell)}
              disabled={disabled || phase !== "RUNNING"}
              className={[
                "aspect-square rounded-2xl border text-sm font-black transition",
                isBlocked
                  ? "border-slate-200 bg-slate-200 text-slate-500"
                  : isOnTrail
                    ? "border-emerald-500 bg-emerald-100 text-emerald-900"
                    : isStart || isFinish
                      ? "border-indigo-400 bg-indigo-100 text-indigo-900"
                      : isCheckpoint
                        ? "border-amber-400 bg-amber-100 text-amber-900"
                        : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100",
              ].join(" ")}
            >
              {label}
            </button>
          );
        })}
      </div>

      {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
