"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { GameProps } from "../types";

const WORD_BANK = [
  "Pick",
  "Play",
  "PwnIt",
  "Prize",
  "Bonus",
  "Credit",
  "Boost",
  "Target",
  "Podium",
  "Voucher",
  "Unlock",
  "Winner",
  "Sprint",
  "Skill",
  "Rank",
  "Activate",
  "Final",
  "Compete",
  "Leader",
  "Momentum",
];
const BASE_SHOW_MS = 1900;
const MIN_SHOW_MS = 700;
const BASE_ROUND_SCORE = 15000;

type Challenge = {
  game?: "spot-the-missing";
  shown: string[];
  remaining: string[];
  missing?: string;
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

function buildChallenge(level = 1): Challenge {
  const shownCount = Math.min(9, 5 + Math.floor((level - 1) / 2));
  const optionCount = Math.min(6, 4 + Math.floor((level - 1) / 3));
  const shown = shuffle(WORD_BANK).slice(0, shownCount);
  const missingIndex = Math.floor(Math.random() * shown.length);
  const missing = shown[missingIndex]!;
  const remaining = shown.filter((_, index) => index !== missingIndex);
  const distractors = shuffle(WORD_BANK.filter((word) => !shown.includes(word))).slice(0, Math.max(0, optionCount - 1));
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
  const verifiedMode = Boolean(injectedChallenge);
  const [level, setLevel] = useState(1);
  const [localChallenge, setLocalChallenge] = useState<Challenge>(() => buildChallenge(1));
  const challenge = injectedChallenge ?? localChallenge;
  const [phase, setPhase] = useState<"READY" | "SHOW" | "INPUT" | "DONE">("READY");
  const [message, setMessage] = useState<string | null>(null);
  const [runScore, setRunScore] = useState(0);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const inputEndsAtRef = useRef<number | null>(null);
  const missingWord = useMemo(() => deriveMissingWord(challenge), [challenge]);
  const showMs = verifiedMode ? BASE_SHOW_MS : Math.max(MIN_SHOW_MS, BASE_SHOW_MS - (level - 1) * 140);

  useEffect(() => {
    if (!verifiedMode) return;
    setPhase("READY");
    setMessage(null);
    setRunScore(0);
    setFinalScore(null);
    setRemainingMs(null);
  }, [injectedChallenge, verifiedMode]);

  useEffect(() => {
    if (phase !== "SHOW") return undefined;
    const timer = window.setTimeout(() => {
      setPhase("INPUT");
      startedAtRef.current = Date.now();
      const inputWindow = verifiedMode ? 8000 : Math.max(2800, 6500 - (level - 1) * 450);
      inputEndsAtRef.current = Date.now() + inputWindow;
      setRemainingMs(inputWindow);
      setMessage("One tile disappeared. Choose the missing one.");
    }, showMs);
    return () => window.clearTimeout(timer);
  }, [phase, showMs, verifiedMode, level]);

  useEffect(() => {
    if (phase !== "INPUT" || inputEndsAtRef.current == null) return undefined;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, inputEndsAtRef.current! - Date.now());
      setRemainingMs(remaining);
      if (remaining <= 0) {
        window.clearInterval(timer);
        finish(false, undefined, "Time up.");
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [phase, level]);

  function beginShow(nextChallenge: Challenge, nextLevel: number, nextRunScore: number) {
    if (!verifiedMode) {
      setLocalChallenge(nextChallenge);
      setLevel(nextLevel);
      setRunScore(nextRunScore);
    }
    setPhase("SHOW");
    setMessage(`Level ${nextLevel}: memorise the full set before one option disappears.`);
    setFinalScore(null);
    setRemainingMs(null);
    startedAtRef.current = null;
    inputEndsAtRef.current = null;
  }

  function start() {
    if (disabled) return;
    if (verifiedMode) {
      beginShow(challenge, 1, 0);
      return;
    }
    beginShow(buildChallenge(1), 1, 0);
  }

  function finish(correct: boolean, chosen?: string, customMessage?: string) {
    const elapsedMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));

    if (verifiedMode) {
      const scoreMs = correct ? Math.max(1200, 21000 - elapsedMs) : 0;
      setPhase("DONE");
      setFinalScore(scoreMs);
      setMessage(customMessage ?? (correct ? "Correct." : missingWord ? `Not quite. The missing tile was ${missingWord}.` : "Not quite."));
      onFinish({
        scoreMs,
        meta: {
          game: "spot-the-missing",
          chosen,
          ...(missingWord ? { missing: missingWord } : {}),
          elapsedMs,
        },
      });
      return;
    }

    if (!correct) {
      setPhase("DONE");
      setFinalScore(runScore);
      setRemainingMs(0);
      setMessage(customMessage ?? (missingWord ? `Run over. The missing tile was ${missingWord}.` : "Run over."));
      onFinish({
        scoreMs: runScore,
        meta: {
          game: "spot-the-missing",
          roundsCleared: Math.max(0, level - 1),
          levelReached: level,
          elapsedMs,
        },
      });
      return;
    }

    const roundScore = Math.max(800, BASE_ROUND_SCORE - elapsedMs - (level - 1) * 250);
    const nextRunScore = runScore + roundScore;
    const nextLevel = level + 1;
    beginShow(buildChallenge(nextLevel), nextLevel, nextRunScore);
  }

  function choose(word: string) {
    if (disabled || phase !== "INPUT") return;
    const correct = word === missingWord;
    finish(correct, word);
  }

  const visibleWords = phase === "SHOW" ? challenge.shown : phase === "READY" ? [] : challenge.remaining;

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objective</div>
          <h3 className="mt-1 text-base font-black text-slate-950 sm:text-lg">Spot the Missing</h3>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            A word grid appears briefly. One tile then disappears. Pick the missing answer option before the timer expires. Practice mode continues until you make a mistake.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!verifiedMode ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">Level {level}</span>
          ) : null}
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            {challenge.shown.length} tiles
          </span>
          {remainingMs != null ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
              {Math.max(0, Math.ceil(remainingMs / 1000))}s
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 rounded-[28px] border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Visible set</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {visibleWords.length ? (
            visibleWords.map((word) => (
              <div key={word} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-sm font-bold text-slate-800 shadow-sm">
                {word}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500 sm:col-span-2 lg:col-span-3">
              Press start to reveal the set.
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={start}
          disabled={disabled || phase === "SHOW" || phase === "INPUT"}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          {phase === "READY" ? "Start spot the missing" : verifiedMode ? "Play again" : "Replay with a fresh run"}
        </button>
        {!verifiedMode ? (
          <span className="rounded-2xl bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800 ring-1 ring-emerald-200">
            Run score {runScore.toLocaleString("en-ZA")}
          </span>
        ) : null}
      </div>

      <div className="mt-5">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Choose the missing answer option</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {challenge.options.map((word) => (
            <button
              key={word}
              type="button"
              onClick={() => choose(word)}
              disabled={disabled || phase !== "INPUT"}
              className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-left text-sm font-bold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              {word}
            </button>
          ))}
        </div>
      </div>

      {message ? <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">{message}</div> : null}
      {finalScore != null ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
          Final score {finalScore.toLocaleString("en-ZA")} · Rounds cleared {Math.max(0, level - 1)}
        </div>
      ) : null}
    </div>
  );
}
