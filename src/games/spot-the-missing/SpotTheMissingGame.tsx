"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GameProps } from "../types";

type Challenge = {
  game: "spot-the-missing";
  shown: string[];
  remaining: string[];
  options: string[];
};

const SHOW_MS = 2400;
const MAX_SCORE = 10000;
const WORD_BANK = [
  "prize",
  "pixel",
  "boost",
  "route",
  "focus",
  "switch",
  "vault",
  "signal",
  "glow",
  "rocket",
  "cipher",
  "badge",
] as const;

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
  const shown = shuffle(WORD_BANK).slice(0, 6);
  const missingIndex = randomInt(shown.length);
  const missing = shown[missingIndex]!;
  const remaining = shown.filter((_, index) => index !== missingIndex);
  const distractors = shuffle(WORD_BANK.filter((word) => !shown.includes(word))).slice(0, 3);
  return {
    game: "spot-the-missing",
    shown,
    remaining,
    options: shuffle([missing, ...distractors]),
  };
}

function deriveMissing(challenge: Challenge) {
  return challenge.shown.find((word) => !challenge.remaining.includes(word));
}

export default function SpotTheMissingGame({ onFinish, disabled, challenge: injectedChallenge }: GameProps<Challenge>) {
  const challenge = useMemo(() => injectedChallenge ?? buildChallenge(), [injectedChallenge]);
  const [phase, setPhase] = useState<"READY" | "SHOW" | "INPUT" | "DONE">("READY");
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (phase !== "SHOW") return;
    const timer = window.setTimeout(() => {
      setPhase("INPUT");
      setMessage("Which word disappeared?");
      startedAtRef.current = Date.now();
    }, SHOW_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  function reset() {
    setPhase("SHOW");
    setMessage("Memorise the full set.");
    setScore(null);
    startedAtRef.current = null;
  }

  function choose(word: string) {
    if (disabled || phase !== "INPUT") return;
    const elapsedMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));
    const correctWord = deriveMissing(challenge);
    const correct = word === correctWord;
    const finalScore = correct ? Math.max(1200, MAX_SCORE - elapsedMs) : 0;
    setPhase("DONE");
    setScore(finalScore);
    setMessage(correct ? "Correct." : `Not quite. The missing word was ${correctWord}.`);
    onFinish({
      scoreMs: finalScore,
      meta: {
        game: "spot-the-missing",
        chosen: word,
      },
    });
  }

  const visibleWords = phase === "SHOW" ? challenge.shown : phase === "READY" ? [] : challenge.remaining;

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Spot the Missing</div>
          <div className="text-lg font-black text-slate-900">Recall the hidden word</div>
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

      {score !== null ? <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Score: {score}</div> : null}

      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Word bank</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {visibleWords.map((word) => (
            <span key={word} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm">
              {word}
            </span>
          ))}
        </div>
      </div>

      {phase === "INPUT" || phase === "DONE" ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {challenge.options.map((word) => (
            <button
              key={word}
              type="button"
              onClick={() => choose(word)}
              disabled={disabled || phase !== "INPUT"}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {word}
            </button>
          ))}
        </div>
      ) : null}

      {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
