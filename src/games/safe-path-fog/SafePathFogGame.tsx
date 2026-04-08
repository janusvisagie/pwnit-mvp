"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { GameProps } from "../types";

type Challenge = {
  game?: "safe-path-fog";
  size?: number;
  start?: number;
  goal?: number;
  hazards?: number[];
  maxMoves?: number;
  startHint?: number;
  attemptId?: string;
};

const DEFAULT_SIZE = 5;
const DEFAULT_START = 20;
const DEFAULT_GOAL = 4;
const DEFAULT_MAX_MOVES = 10;
const DEFAULT_HAZARDS = [1, 2, 6, 8, 11, 17, 18];
const MAX_SCORE = 27000;

function neighbors(index: number, size: number) {
  const row = Math.floor(index / size);
  const col = index % size;
  const output: number[] = [];
  if (row > 0) output.push(index - size);
  if (row < size - 1) output.push(index + size);
  if (col > 0) output.push(index - 1);
  if (col < size - 1) output.push(index + 1);
  return output;
}

function countAdjacentHazards(index: number, size: number, hazards: Set<number>) {
  return neighbors(index, size).filter((neighbor) => hazards.has(neighbor)).length;
}

function buildChallenge(): Challenge {
  const hazards = DEFAULT_HAZARDS;
  const hazardSet = new Set<number>(hazards);
  return {
    game: "safe-path-fog",
    size: DEFAULT_SIZE,
    start: DEFAULT_START,
    goal: DEFAULT_GOAL,
    hazards,
    maxMoves: DEFAULT_MAX_MOVES,
    startHint: countAdjacentHazards(DEFAULT_START, DEFAULT_SIZE, hazardSet),
  };
}

export default function SafePathFogGame({ onFinish, disabled, challenge: injectedChallenge }: GameProps<Challenge>) {
  const [localChallenge, setLocalChallenge] = useState<Challenge>(() => buildChallenge());
  const verifiedMode = Boolean(injectedChallenge?.attemptId);
  const challenge = useMemo(() => (verifiedMode ? (injectedChallenge as Challenge) : localChallenge), [verifiedMode, injectedChallenge, localChallenge]);
  const size = challenge.size ?? DEFAULT_SIZE;
  const start = challenge.start ?? DEFAULT_START;
  const goal = challenge.goal ?? DEFAULT_GOAL;
  const maxMoves = challenge.maxMoves ?? DEFAULT_MAX_MOVES;

  const [phase, setPhase] = useState<"READY" | "RUNNING" | "DONE">("READY");
  const [path, setPath] = useState<number[]>([start]);
  const [hints, setHints] = useState<Record<string, number>>({ [String(start)]: challenge.startHint ?? 0 });
  const [status, setStatus] = useState<"RUNNING" | "WON" | "LOST">("RUNNING");
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    setPhase("READY");
    setPath([start]);
    setHints({ [String(start)]: challenge.startHint ?? 0 });
    setStatus("RUNNING");
    setMessage(null);
    setScore(null);
    setPending(false);
    startedAtRef.current = null;
  }, [challenge]);

  function startRun(nextChallenge?: Challenge) {
    if (disabled) return;
    const activeChallenge = nextChallenge ?? challenge;
    const activeStart = activeChallenge.start ?? DEFAULT_START;
    const activeStartHint = activeChallenge.startHint ?? 0;
    setPhase("RUNNING");
    setPath([activeStart]);
    setHints({ [String(activeStart)]: activeStartHint });
    setStatus("RUNNING");
    setScore(null);
    setPending(false);
    setMessage(
      verifiedMode
        ? "The hazard map stays hidden on the server. Move only to adjacent fog tiles and use the hint numbers you uncover."
        : "Move only to adjacent fog tiles and use the hint numbers you uncover.",
    );
    startedAtRef.current = Date.now();
  }

  function finishRun(nextStatus: "WON" | "LOST", moveCount: number) {
    const elapsedMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));
    const finalScore = nextStatus === "WON" ? Math.max(1200, MAX_SCORE - elapsedMs - moveCount * 650) : 0;
    setPhase("DONE");
    setStatus(nextStatus);
    setScore(finalScore);
    setMessage(nextStatus === "WON" ? "Goal reached." : "The fog claimed this run.");
    onFinish({
      scoreMs: finalScore,
      meta: {
        game: "safe-path-fog",
        elapsedMs,
        serverProgress: verifiedMode,
      },
    });
  }

  async function moveTo(nextIndex: number) {
    if (disabled || pending || phase !== "RUNNING") return;
    const current = path[path.length - 1] ?? start;
    if (!neighbors(current, size).includes(nextIndex)) return;

    if (!verifiedMode) {
      const hazardSet = new Set<number>(challenge.hazards ?? DEFAULT_HAZARDS);
      const nextPath = [...path, nextIndex];
      setPath(nextPath);
      if (hazardSet.has(nextIndex)) {
        finishRun("LOST", nextPath.length - 1);
        return;
      }
      const nextHints = { ...hints, [String(nextIndex)]: countAdjacentHazards(nextIndex, size, hazardSet) };
      setHints(nextHints);
      if (nextIndex === goal) {
        finishRun("WON", nextPath.length - 1);
        return;
      }
      if (nextPath.length - 1 >= maxMoves) {
        finishRun("LOST", nextPath.length - 1);
        return;
      }
      setMessage(`Safe tile. Hint ${nextHints[String(nextIndex)]}.`);
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/attempt/progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId: challenge.attemptId, nextIndex }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setMessage(data?.error || `Could not move through the fog (${res.status})`);
        return;
      }
      const nextPath = Array.isArray(data.path) ? data.path.map((value: unknown) => Number(value)) : [start];
      setPath(nextPath);
      setHints((data.hints ?? {}) as Record<string, number>);
      const nextStatus = String(data.status || "RUNNING") as "RUNNING" | "WON" | "LOST";
      setStatus(nextStatus);
      if (nextStatus === "WON" || nextStatus === "LOST") {
        finishRun(nextStatus, Number(data.moveCount || 0));
        return;
      }
      const latest = nextPath[nextPath.length - 1] ?? start;
      const hintValue = Number((data.hints ?? {})[String(latest)] ?? 0);
      setMessage(`Safe tile. Hint ${hintValue}.`);
    } catch (e: any) {
      setMessage(e?.message || "Could not move through the fog.");
    } finally {
      setPending(false);
    }
  }

  const current = path[path.length - 1] ?? start;
  const moveCount = path.length - 1;

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objective</div>
          <h3 className="mt-1 text-base font-black text-slate-950 sm:text-lg">Safe Path Fog</h3>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          Moves {moveCount} / {maxMoves}
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        Reach the goal through the fog. Each safe tile reveals a hint number showing how many hazard tiles touch it directly up, down, left, or right.
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Start is at the bottom-left. Goal is at the top-right. Only adjacent moves are allowed. This version still includes a luck element, so I would treat it as experimental rather than a final competitive game.
      </p>

      <div className="mt-3 grid grid-cols-5 gap-2">
        {Array.from({ length: size * size }, (_, index) => {
          const visited = path.includes(index);
          const isCurrent = current === index;
          const isGoal = index === goal;
          const hint = hints[String(index)];
          const canMove = phase === "RUNNING" && neighbors(current, size).includes(index) && !visited;
          return (
            <button
              key={index}
              type="button"
              onClick={() => void moveTo(index)}
              disabled={disabled || pending || phase !== "RUNNING" || !canMove}
              className={`flex aspect-square min-h-[56px] items-center justify-center rounded-2xl border text-sm font-black transition ${
                visited
                  ? isCurrent
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-900"
                  : isGoal
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : canMove
                      ? "border-slate-300 bg-slate-50 text-slate-500 hover:-translate-y-0.5 hover:border-slate-400"
                      : "border-slate-200 bg-slate-100 text-slate-300"
              } disabled:cursor-not-allowed`}
            >
              {index === start && !visited ? "S" : visited ? hint : isGoal ? "G" : "·"}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            if (!verifiedMode && phase !== "READY") {
              const nextChallenge = buildChallenge();
              setLocalChallenge(nextChallenge);
              startRun(nextChallenge);
              return;
            }
            startRun();
          }}
          disabled={disabled || pending || phase === "RUNNING"}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          {phase === "READY" ? "Start Safe Path Fog" : "Replay"}
        </button>
      </div>

      {message ? (
        <div className="mt-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">{message}</div>
      ) : null}

      {score != null ? (
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
          Score {score.toLocaleString("en-ZA")}
        </div>
      ) : null}
    </div>
  );
}
