"use client";

import { useEffect, useRef, useState } from "react";

import type { GameProps } from "../types";

const WORD_BANK = ["Pick", "Play", "PwnIt", "Prize", "Bonus", "Credit", "Boost", "Target", "Podium", "Voucher", "Unlock", "Winner"];
const SHOW_MS = 1800;
const MAX_SCORE = 21000;

type Challenge = {
  game?: "spot-the-missing";
  shown: string[];
  remaining: string[];
  missing?: string;
  options: string[];
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

function deriveMissingWord(challenge: Challenge) {
  if (challenge.missing) return challenge.missing;
  return challenge.shown.find((word) => !challenge.remaining.includes(word)) ?? "";
}

export default function SpotTheMissingGame({ onFinish, disabled, challenge: injectedChallenge }: GameProps<Challenge>) {
  const verifiedMode = Boolean(injectedChallenge?.attemptId);
  const [localChallenge, setLocalChallenge] = useState<Challenge>(() => buildChallenge());
  const challenge = injectedChallenge ?? localChallenge;
  const [phase, setPhase] = useState<"READY" | "SHOW" | "INPUT" | "DONE">("READY");
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const missingWord = deriveMissingWord(challenge);

  useEffect(() => {
    if (phase !== "SHOW") return undefined;
    const timer = window.setTimeout(() => {
      setPhase("INPUT");
      startedAtRef.current = Date.now();
      setMessage("One word disappeared. Pick the missing one from the options below.");
    }, SHOW_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (!verifiedMode) return;
    setPhase("READY");
    setMessage(null);
    setScore(null);
    startedAtRef.current = null;
  }, [challenge.attemptId, verifiedMode]);

  function start() {
    if (disabled) return;
    if (!verifiedMode && phase === "DONE") {
      setLocalChallenge(buildChallenge());
    }
    setPhase("SHOW");
    setMessage("Memorise the six words, then pick the one that disappears.");
    setScore(null);
    startedAtRef.current = null;
  }

  function choose(word: string) {
    if (disabled || phase !== "INPUT") return;
    const elapsedMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));
    const correct = word === missingWord;
    const finalScore = correct ? Math.max(1200, MAX_SCORE - elapsedMs) : 0;

    setPhase("DONE");
    setScore(finalScore);
    setMessage(correct ? "Correct." : missingWord ? `Not quite. The missing word was ${missingWord}.` : "Not quite.");

    onFinish({
      scoreMs: finalScore,
      meta: {
        game: "spot-the-missing",
        chosen: word,
        ...(missingWord ? { missing: missingWord } : {}),
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

      <p className="mt-2 text-sm text-slate-600">Start the run, memorise the visible set, then choose the one word that disappears.</p>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Visible words</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {visibleWords.length ? (
            visibleWords.map((word) => (
              <span key={word} className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm">
                {word}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-500">Press start to reveal the set.</span>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {challenge.options.map((word) => (
          <button
            key={word}
            type="button"
            onClick={() => choose(word)}
            disabled={disabled || phase !== "INPUT"}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-900 disabled:opacity-50"
          >
            {word}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {(phase === "READY" || phase === "DONE") ? (
          <button type="button" onClick={start} disabled={disabled} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
            {phase === "READY" ? "Start" : "Replay"}
          </button>
        ) : null}
      </div>

      {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
      {typeof score === "number" ? <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Local score: {score}</p> : null}
    </div>
  );
}
