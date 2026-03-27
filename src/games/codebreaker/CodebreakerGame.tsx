"use client";

import { useMemo, useRef, useState } from "react";

import type { GameProps } from "../types";

const DIGIT_POOL = [1, 2, 3, 4, 5, 6];
const CODE_LENGTH = 4;
const MAX_GUESSES = 6;
const MAX_SCORE = 26000;

type GuessRow = {
  value: number[];
  exact: number;
  misplaced: number;
};

type Challenge = {
  game?: "codebreaker";
  solution: number[];
};

function shuffle<T>(values: readonly T[]) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function buildChallenge(): Challenge {
  return {
    game: "codebreaker",
    solution: shuffle(DIGIT_POOL).slice(0, CODE_LENGTH),
  };
}

function gradeGuess(guess: number[], solution: number[]) {
  let exact = 0;
  let misplaced = 0;
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    if (guess[i] === solution[i]) exact += 1;
    else if (solution.includes(guess[i]!)) misplaced += 1;
  }
  return { exact, misplaced };
}

export default function CodebreakerGame({ onFinish, disabled, challenge: injectedChallenge }: GameProps<Challenge>) {
  const challenge = useMemo(() => injectedChallenge ?? buildChallenge(), [injectedChallenge]);
  const [phase, setPhase] = useState<"READY" | "RUNNING" | "DONE">("READY");
  const [guess, setGuess] = useState<number[]>([]);
  const [rows, setRows] = useState<GuessRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const startedAtRef = useRef<number | null>(null);

  function start() {
    if (disabled) return;
    setPhase("RUNNING");
    setGuess([]);
    setRows([]);
    setScore(null);
    setMessage("Crack the hidden code in as few guesses as possible.");
    startedAtRef.current = Date.now();
  }

  function addDigit(digit: number) {
    if (disabled || phase !== "RUNNING" || guess.length >= CODE_LENGTH || guess.includes(digit)) return;
    setGuess((current) => [...current, digit]);
  }

  function removeLast() {
    if (disabled || phase !== "RUNNING" || guess.length === 0) return;
    setGuess((current) => current.slice(0, -1));
  }

  function clearGuess() {
    if (disabled || phase !== "RUNNING" || guess.length === 0) return;
    setGuess([]);
  }

  function submitGuess() {
    if (disabled || phase !== "RUNNING" || guess.length !== CODE_LENGTH) return;
    const graded = gradeGuess(guess, challenge.solution);
    const nextRows = [...rows, { value: guess, ...graded }];
    setRows(nextRows);
    setGuess([]);

    if (graded.exact === CODE_LENGTH) {
      const elapsedMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));
      const finalScore = Math.max(1200, MAX_SCORE - elapsedMs - rows.length * 2600);
      setPhase("DONE");
      setScore(finalScore);
      setMessage("Code cracked.");
      onFinish({
        scoreMs: finalScore,
        meta: {
          game: "codebreaker",
          elapsedMs,
          guessLog: nextRows,
        },
      });
      return;
    }

    if (nextRows.length >= MAX_GUESSES) {
      setPhase("DONE");
      setScore(0);
      setMessage("Out of guesses.");
      onFinish({
        scoreMs: 0,
        meta: {
          game: "codebreaker",
          elapsedMs: Math.max(0, Date.now() - (startedAtRef.current ?? Date.now())),
          guessLog: nextRows,
        },
      });
      return;
    }

    setMessage(`Exact ${graded.exact}. Misplaced ${graded.misplaced}.`);
  }

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objective</div>
          <h3 className="mt-1 text-base font-black text-slate-950 sm:text-lg">Codebreaker</h3>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          Guesses {rows.length} / {MAX_GUESSES}
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        Crack the hidden 4-digit code using digits 1–6. After each guess, you’ll see how many digits are exact and how many belong elsewhere.
      </p>
      <p className="mt-1 text-xs text-slate-500">Clear empties your current unfinished guess. New code starts a fresh round with a different hidden code.</p>

      <div className="mt-3 grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current guess</div>
          <div className="mt-2 flex gap-2">
            {Array.from({ length: CODE_LENGTH }, (_, index) => (
              <div
                key={index}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-base font-black text-slate-900 sm:h-11 sm:w-11 sm:text-lg"
              >
                {guess[index] ?? "•"}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {DIGIT_POOL.map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => addDigit(digit)}
              disabled={disabled || phase !== "RUNNING" || guess.includes(digit)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base font-black text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              {digit}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={submitGuess}
          disabled={disabled || phase !== "RUNNING" || guess.length !== CODE_LENGTH}
          className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Submit guess
        </button>
        <button
          type="button"
          onClick={removeLast}
          disabled={disabled || phase !== "RUNNING" || guess.length === 0}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          Remove last
        </button>
        <button
          type="button"
          onClick={clearGuess}
          disabled={disabled || phase !== "RUNNING" || guess.length === 0}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={start}
          disabled={disabled}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          {phase === "READY" ? "Start Codebreaker" : "New code"}
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

      <div className="mt-3 space-y-2">
        {rows.map((row, index) => (
          <div
            key={`${row.value.join("")}-${index}`}
            className="grid grid-cols-3 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700"
          >
            <div className="font-black text-slate-900">{row.value.join("")}</div>
            <div>Exact {row.exact}</div>
            <div>Misplaced {row.misplaced}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
