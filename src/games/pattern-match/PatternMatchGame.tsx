"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { GameProps } from "../types";

const WORD_BANK = ["Pick", "Play", "PwnIt", "Prize", "Bonus", "Credit", "Boost", "Target", "Podium", "Voucher", "Unlock", "Winner"];
const SHOW_MS = 1800;
const MAX_SCORE = 22000;

type Challenge = {
  game?: "pattern-match";
  ordered: string[];
  options: string[][];
  correctIndex: number;
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
  const ordered = shuffle(WORD_BANK).slice(0, 4);
  const distractorA = [...ordered];
  [distractorA[1], distractorA[2]] = [distractorA[2]!, distractorA[1]!];
  const distractorB = [...ordered];
  [distractorB[0], distractorB[3]] = [distractorB[3]!, distractorB[0]!];
  const options = shuffle([ordered, distractorA, distractorB]);
  return {
    game: "pattern-match",
    ordered,
    options,
    correctIndex: options.findIndex((entry) => entry.every((word, index) => word === ordered[index])),
  };
}

export default function PatternMatchGame({ onFinish, disabled, challenge: injectedChallenge }: GameProps<Challenge>) {
  const challenge = useMemo(() => injectedChallenge ?? buildChallenge(), [injectedChallenge]);
  const [phase, setPhase] = useState<"READY" | "SHOW" | "INPUT" | "DONE">("READY");
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (phase !== "SHOW") return undefined;
    const timer = window.setTimeout(() => {
      setPhase("INPUT");
      startedAtRef.current = Date.now();
      setMessage("Pick the strip that matches exactly.");
    }, SHOW_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  function start() {
    if (disabled) return;
    setPhase("SHOW");
    setMessage("Watch the pattern closely.");
    setScore(null);
    startedAtRef.current = null;
  }

  function choose(index: number) {
    if (disabled || phase !== "INPUT") return;
    const elapsedMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));
    const correct = index === challenge.correctIndex;
    const finalScore = correct ? Math.max(1200, MAX_SCORE - elapsedMs) : 0;

    setPhase("DONE");
    setScore(finalScore);
    setMessage(correct ? "Exact match." : "Not that strip.");

    onFinish({
      scoreMs: finalScore,
      meta: {
        game: "pattern-match",
        chosenIndex: index,
        correctIndex: challenge.correctIndex,
        elapsedMs,
      },
    });
  }

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objective</div>
          <h3 className="mt-1 text-base font-black text-slate-950 sm:text-lg">Pattern Match</h3>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">4-word strip</div>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        Watch the strip, then choose the option that matches it exactly in the same order.
      </p>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Shown pattern</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {(phase === "SHOW" ? challenge.ordered : Array.from({ length: challenge.ordered.length }, () => "•")).map((word, index) => (
            <div key={`${word}-${index}`} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-900">
              {word}
            </div>
          ))}
        </div>
      </div>

      {phase === "INPUT" || phase === "DONE" ? (
        <div className="mt-3 space-y-2">
          {challenge.options.map((option, index) => (
            <button
              key={`option-${index}`}
              type="button"
              onClick={() => choose(index)}
              disabled={disabled || phase !== "INPUT"}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-700">{String.fromCharCode(65 + index)}</span>
              {option.join("  •  ")}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={start}
          disabled={disabled}
          className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {phase === "READY" ? "Start Pattern Match" : "Restart"}
        </button>
      </div>

      {message ? <div className="mt-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">{message}</div> : null}

      {score != null ? (
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
          Score {score.toLocaleString("en-ZA")}
        </div>
      ) : null}
    </div>
  );
}
