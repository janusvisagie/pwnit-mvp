"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { GameProps } from "../types";

const WORD_BANK = ["Pick", "Play", "PwnIt", "Prize", "Bonus", "Credit", "Boost", "Target", "Podium", "Voucher", "Unlock", "Winner"];
const SHOW_MS = 1800;
const MAX_SCORE = 21000;

type Challenge = {
  game?: "spot-the-missing";
  shown: string[];
  remaining: string[];
  missing: string;
  options: string[];
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
  const shown = shuffle(WORD_BANK).slice(0, 6);
  const missingIndex = Math.floor(Math.random() * shown.length);
  const missing = shown[missingIndex]!;
  const remaining = shown.filter((_, index) => index !== missingIndex);
  const distractors = shuffle(WORD_BANK.filter((word) => !shown.includes(word))).slice(0, 3);
  return {
    game: "spot-the-missing",
    shown,
    remaining,
    missing,
    options: shuffle([missing, ...distractors]),
  };
}

export default function SpotTheMissingGame({ onFinish, disabled, challenge: injectedChallenge }: GameProps<Challenge>) {
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
      setMessage("One word disappeared. Pick the missing one.");
    }, SHOW_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  function start() {
    if (disabled) return;
    setPhase("SHOW");
    setMessage("Memorise all six words.");
    setScore(null);
    startedAtRef.current = null;
  }

  function choose(word: string) {
    if (disabled || phase !== "INPUT") return;
    const elapsedMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));
    const correct = word === challenge.missing;
    const finalScore = correct ? Math.max(1200, MAX_SCORE - elapsedMs) : 0;

    setPhase("DONE");
    setScore(finalScore);
    setMessage(correct ? "Correct." : `Not quite. The missing word was ${challenge.missing}.`);

    onFinish({
      scoreMs: finalScore,
      meta: {
        game: "spot-the-missing",
        chosen: word,
        missing: challenge.missing,
        elapsedMs,
      },
    });
  }

  const visibleWords = phase === "SHOW" ? challenge.shown : phase === "READY" ? [] : challenge.remaining;

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objective</div>
          <h3 className="mt-1 text-base font-black text-slate-950 sm:text-lg">Spot the Missing</h3>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">6 words</div>
      </div>

      <p className="mt-2 text-sm text-slate-600">Watch the set of PwnIt words, then choose the one that disappears.</p>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Board</div>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {visibleWords.length
            ? visibleWords.map((word, index) => (
                <div key={`${word}-${index}`} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-black text-slate-900">
                  {word}
                </div>
              ))
            : Array.from({ length: 6 }, (_, index) => (
                <div key={`empty-${index}`} className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-400">
                  Hidden
                </div>
              ))}
        </div>
      </div>

      {phase === "INPUT" || phase === "DONE" ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {challenge.options.map((word) => (
            <button
              key={word}
              type="button"
              onClick={() => choose(word)}
              disabled={disabled || phase !== "INPUT"}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-black text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              {word}
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
          {phase === "READY" ? "Start Spot the Missing" : "Restart"}
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
