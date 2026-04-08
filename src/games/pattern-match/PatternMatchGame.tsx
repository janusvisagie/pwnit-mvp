"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { GameProps } from "../types";

const WORD_BANK = ["Pick", "Play", "PwnIt", "Prize", "Bonus", "Credit", "Boost", "Target", "Podium", "Voucher", "Unlock", "Winner"] as const;
const SHOW_MS = 1800;
const MAX_SCORE = 22000;

type Challenge = {
  game?: "pattern-match";
  ordered: string[];
  options: string[][];
  correctIndex?: number;
};

function shuffle<T>(values: readonly T[]) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function sameArray<T>(a: T[], b: T[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function buildChallenge(): Challenge {
  const ordered = shuffle(WORD_BANK).slice(0, 4) as string[];
  const distractors = new Set<string>();
  while (distractors.size < 3) {
    const candidate = shuffle(ordered).join("|");
    if (candidate !== ordered.join("|")) distractors.add(candidate);
  }
  const options = shuffle([ordered, ...Array.from(distractors).map((entry) => entry.split("|"))]);
  return {
    game: "pattern-match",
    ordered,
    options,
    correctIndex: options.findIndex((option) => sameArray(option, ordered)),
  };
}

function stripLabel(tokens: string[]) {
  return tokens.join(" • ");
}

function buildInitialChallenge(): Challenge {
  const ordered = WORD_BANK.slice(0, 4) as unknown as string[];
  const options = [
    ordered,
    [ordered[1], ordered[0], ordered[2], ordered[3]],
    [ordered[0], ordered[2], ordered[1], ordered[3]],
    [ordered[3], ordered[2], ordered[1], ordered[0]],
  ];
  return {
    game: "pattern-match",
    ordered,
    options,
    correctIndex: 0,
  };
}


export default function PatternMatchGame({ onFinish, disabled, challenge: injectedChallenge }: GameProps<Challenge>) {
  const [localChallenge, setLocalChallenge] = useState<Challenge>(() => injectedChallenge ?? buildInitialChallenge());
  const challenge = useMemo(() => injectedChallenge ?? localChallenge, [injectedChallenge, localChallenge]);
  const [phase, setPhase] = useState<"READY" | "SHOW" | "INPUT" | "DONE">("READY");
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!injectedChallenge) return;
    setPhase("READY");
    setMessage(null);
    setScore(null);
    startedAtRef.current = null;
  }, [injectedChallenge]);

  useEffect(() => {
    if (phase !== "SHOW") return undefined;
    const timer = window.setTimeout(() => {
      setPhase("INPUT");
      startedAtRef.current = Date.now();
      setMessage("Choose the strip with the exact same visual order.");
    }, SHOW_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  function start(fresh: boolean) {
    if (disabled) return;
    if (fresh && !injectedChallenge) {
      setLocalChallenge(buildChallenge());
    }
    setPhase("SHOW");
    setMessage("Watch the pattern closely.");
    setScore(null);
    startedAtRef.current = null;
  }

  function choose(index: number) {
    if (disabled || phase !== "INPUT") return;
    const elapsedMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));
    const chosen = challenge.options[index] ?? [];
    const correct = typeof challenge.correctIndex === "number" ? index === challenge.correctIndex : sameArray(chosen, challenge.ordered);
    const finalScore = correct ? Math.max(1200, MAX_SCORE - elapsedMs) : 0;

    setPhase("DONE");
    setScore(finalScore);
    setMessage(correct ? "Exact match." : "Not that strip.");

    onFinish({
      scoreMs: finalScore,
      meta: {
        game: "pattern-match",
        chosenIndex: index,
        ...(typeof challenge.correctIndex === "number" ? { correctIndex: challenge.correctIndex } : {}),
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
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">Visual strip</div>
      </div>

      <p className="mt-2 text-sm text-slate-600">Watch the strip, then choose the option that matches exactly in the same order.</p>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Shown pattern</div>
        <div className="mt-2 rounded-2xl border border-slate-200 bg-white px-3 py-4 text-center text-sm font-semibold text-slate-800">
          {phase === "SHOW" ? stripLabel(challenge.ordered) : phase === "READY" ? "Press start to reveal the strip." : "Pattern hidden"}
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {challenge.options.map((option, index) => (
          <button
            key={index}
            type="button"
            onClick={() => choose(index)}
            disabled={disabled || phase !== "INPUT"}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-900 disabled:opacity-50"
          >
            {String.fromCharCode(65 + index)}. {stripLabel(option)}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {phase === "READY" ? (
          <button type="button" onClick={() => start(true)} disabled={disabled} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
            Start
          </button>
        ) : phase === "DONE" ? (
          <button type="button" onClick={() => start(true)} disabled={disabled} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
            Replay
          </button>
        ) : null}
      </div>

      {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
      {typeof score === "number" ? <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Local score: {score}</p> : null}
    </div>
  );
}
