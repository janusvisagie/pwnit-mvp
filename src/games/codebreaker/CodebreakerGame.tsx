
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { GameProps } from "../types";

const DEFAULT_DIGIT_POOL = [1, 2, 3, 4, 5, 6];
const DEFAULT_CODE_LENGTH = 4;
const DEFAULT_MAX_GUESSES = 6;
const MAX_SCORE = 28000;

type GuessRow = {
  value: number[];
  exact: number;
  misplaced: number;
};

type Challenge = {
  game?: "codebreaker";
  solution?: number[];
  digitPool?: number[];
  codeLength?: number;
  maxGuesses?: number;
  attemptId?: string;
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
  const digitPool = [...DEFAULT_DIGIT_POOL];
  return {
    game: "codebreaker",
    solution: shuffle(digitPool).slice(0, DEFAULT_CODE_LENGTH),
    digitPool,
    codeLength: DEFAULT_CODE_LENGTH,
    maxGuesses: DEFAULT_MAX_GUESSES,
  };
}

function gradeGuess(guess: number[], solution: number[]) {
  let exact = 0;
  let misplaced = 0;
  for (let i = 0; i < solution.length; i += 1) {
    if (guess[i] === solution[i]) exact += 1;
    else if (solution.includes(guess[i]!)) misplaced += 1;
  }
  return { exact, misplaced };
}

export default function CodebreakerGame({ onFinish, disabled, challenge: injectedChallenge }: GameProps<Challenge>) {
  const challenge = useMemo(() => injectedChallenge ?? buildChallenge(), [injectedChallenge]);
  const digitPool = challenge.digitPool?.length ? challenge.digitPool : DEFAULT_DIGIT_POOL;
  const codeLength = challenge.codeLength ?? DEFAULT_CODE_LENGTH;
  const maxGuesses = challenge.maxGuesses ?? DEFAULT_MAX_GUESSES;
  const verifiedMode = Boolean(challenge.attemptId);

  const [phase, setPhase] = useState<"READY" | "RUNNING" | "DONE">("READY");
  const [guess, setGuess] = useState<number[]>([]);
  const [rows, setRows] = useState<GuessRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    setPhase("READY");
    setGuess([]);
    setRows([]);
    setMessage(null);
    setScore(null);
    setPending(false);
    startedAtRef.current = null;
  }, [challenge.attemptId]);

  function start() {
    if (disabled) return;
    setPhase("RUNNING");
    setGuess([]);
    setRows([]);
    setScore(null);
    setPending(false);
    setMessage(
      verifiedMode
        ? "The hidden code stays on the server. Each guess comes back with exact and misplaced feedback only."
        : "Crack the hidden code in as few guesses as possible.",
    );
    startedAtRef.current = Date.now();
  }

  function addDigit(digit: number) {
    if (disabled || pending || phase !== "RUNNING" || guess.length >= codeLength || guess.includes(digit)) return;
    setGuess((current) => [...current, digit]);
  }

  function removeLast() {
    if (disabled || pending || phase !== "RUNNING" || guess.length === 0) return;
    setGuess((current) => current.slice(0, -1));
  }

  function clearGuess() {
    if (disabled || pending || phase !== "RUNNING" || guess.length === 0) return;
    setGuess([]);
  }

  async function submitVerifiedGuess() {
    if (!challenge.attemptId) return;
    setPending(true);
    try {
      const res = await fetch("/api/attempt/progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId: challenge.attemptId, guess }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setMessage(data?.error || `Could not check guess (${res.status})`);
        return;
      }

      const nextRows = Array.isArray(data.rows) ? (data.rows as GuessRow[]) : [];
      setRows(nextRows);
      setGuess([]);

      if (data.solved) {
        const elapsedMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));
        const finalScore = Math.max(1200, MAX_SCORE - elapsedMs - Math.max(0, nextRows.length - 1) * 2500);
        setPhase("DONE");
        setScore(finalScore);
        setMessage("Code cracked. The server will now lock in the official score.");
        onFinish({
          scoreMs: finalScore,
          meta: {
            game: "codebreaker",
            elapsedMs,
            serverProgress: true,
          },
        });
        return;
      }

      if (data.exhausted) {
        setPhase("DONE");
        setScore(0);
        setMessage("Out of guesses. The server recorded a zero for this run.");
        onFinish({
          scoreMs: 0,
          meta: {
            game: "codebreaker",
            elapsedMs: Math.max(0, Date.now() - (startedAtRef.current ?? Date.now())),
            serverProgress: true,
          },
        });
        return;
      }

      setMessage(`Exact ${data.exact}. Misplaced ${data.misplaced}.`);
    } catch (e: any) {
      setMessage(e?.message || "Could not check guess.");
    } finally {
      setPending(false);
    }
  }

  function submitPracticeGuess() {
    if (guess.length !== codeLength || !challenge.solution) return;
    const graded = gradeGuess(guess, challenge.solution);
    const nextRows = [...rows, { value: guess, ...graded }];
    setRows(nextRows);
    setGuess([]);

    if (graded.exact === codeLength) {
      const elapsedMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));
      const finalScore = Math.max(1200, MAX_SCORE - elapsedMs - Math.max(0, nextRows.length - 1) * 2500);
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

    if (nextRows.length >= maxGuesses) {
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

  function submitGuess() {
    if (disabled || phase !== "RUNNING" || guess.length !== codeLength || pending) return;
    if (verifiedMode) {
      void submitVerifiedGuess();
      return;
    }
    submitPracticeGuess();
  }

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objective</div>
          <h3 className="mt-1 text-base font-black text-slate-950 sm:text-lg">Codebreaker</h3>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          Guesses {rows.length} / {maxGuesses}
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        Crack the hidden {codeLength}-digit code using digits {digitPool.join("–")}. After each guess, you’ll see how many digits are exact and how many belong elsewhere.
      </p>
      <p className="mt-1 text-xs text-slate-500">
        The real answer is never shown before the run starts. Clear empties your current unfinished guess. Replay starts a fresh round after this one ends.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current guess</div>
          <div className="mt-2 flex gap-2">
            {Array.from({ length: codeLength }, (_, index) => (
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
          {digitPool.map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => addDigit(digit)}
              disabled={disabled || pending || phase !== "RUNNING" || guess.includes(digit)}
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
          disabled={disabled || pending || phase !== "RUNNING" || guess.length !== codeLength}
          className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {pending ? "Checking..." : "Submit guess"}
        </button>
        <button
          type="button"
          onClick={removeLast}
          disabled={disabled || pending || phase !== "RUNNING" || guess.length === 0}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          Remove last
        </button>
        <button
          type="button"
          onClick={clearGuess}
          disabled={disabled || pending || phase !== "RUNNING" || guess.length === 0}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={start}
          disabled={disabled || pending || phase === "RUNNING"}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          {phase === "READY" ? "Start Codebreaker" : "Replay"}
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
