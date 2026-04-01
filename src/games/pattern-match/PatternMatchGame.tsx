"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GameProps } from "../types";

type Challenge = {
  game: "pattern-match";
  ordered: string[];
  options: string[][];
};

const SHOW_MS = 2200;
const MAX_SCORE = 10000;

const TILE_SKINS: Record<string, { icon: string; chip: string; accent: string; code: string }> = {
  PwnIt: { icon: "🎯", chip: "bg-rose-100", accent: "bg-rose-400", code: "PWN" },
  Rocket: { icon: "🚀", chip: "bg-indigo-100", accent: "bg-indigo-400", code: "RKT" },
  Shield: { icon: "🛡️", chip: "bg-sky-100", accent: "bg-sky-400", code: "SHD" },
  Bolt: { icon: "⚡", chip: "bg-amber-100", accent: "bg-amber-400", code: "BLT" },
  Puzzle: { icon: "🧩", chip: "bg-emerald-100", accent: "bg-emerald-400", code: "PZL" },
  Spark: { icon: "✨", chip: "bg-fuchsia-100", accent: "bg-fuchsia-400", code: "SPK" },
  Orbit: { icon: "🪐", chip: "bg-violet-100", accent: "bg-violet-400", code: "ORB" },
  Crown: { icon: "👑", chip: "bg-yellow-100", accent: "bg-yellow-400", code: "CRN" },
};

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
  const bank = Object.keys(TILE_SKINS);
  const ordered = shuffle(bank).slice(0, 4);
  const distractorA = [...ordered];
  [distractorA[1], distractorA[2]] = [distractorA[2]!, distractorA[1]!];
  const distractorB = [...ordered];
  [distractorB[0], distractorB[3]] = [distractorB[3]!, distractorB[0]!];
  return {
    game: "pattern-match",
    ordered,
    options: shuffle([ordered, distractorA, distractorB]).map((entry) => [...entry]),
  };
}

function sameArray<T>(a: T[], b: T[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function PatternTile({ value, hidden = false }: { value: string; hidden?: boolean }) {
  const skin = TILE_SKINS[value] ?? TILE_SKINS.PwnIt;
  if (hidden) {
    return <div className="h-16 w-16 rounded-2xl border border-dashed border-slate-300 bg-slate-100" />;
  }

  return (
    <div className="flex h-16 w-16 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      <div className="text-lg leading-none drop-shadow-sm">{skin.icon}</div>
      <div className="space-y-1">
        <div className={`h-1.5 w-5 rounded-full ${skin.accent}`} />
        <div className={`inline-flex rounded-full px-1.5 py-0.5 text-[8px] font-black tracking-[0.18em] text-slate-900 ${skin.chip}`}>
          {skin.code}
        </div>
      </div>
    </div>
  );
}

export default function PatternMatchGame({ onFinish, disabled, challenge: injectedChallenge }: GameProps<Challenge>) {
  const [localChallenge, setLocalChallenge] = useState<Challenge>(() => buildChallenge());
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
    if (phase !== "SHOW") return;
    const timer = window.setTimeout(() => {
      setPhase("INPUT");
      setMessage("Pick the strip that matches what you just saw.");
      startedAtRef.current = Date.now();
    }, SHOW_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  function reset() {
    if (!injectedChallenge) {
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
    const correct = sameArray(challenge.options[index] ?? [], challenge.ordered);
    const finalScore = correct ? Math.max(1200, MAX_SCORE - elapsedMs) : 0;

    setPhase("DONE");
    setScore(finalScore);
    setMessage(correct ? "Exact match." : "Not that strip.");

    onFinish({
      scoreMs: finalScore,
      meta: {
        game: "pattern-match",
        chosenIndex: index,
      },
    });
  }

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pattern Match</div>
          <div className="text-lg font-black text-slate-900">Memorise the strip</div>
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
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Shown pattern</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {challenge.ordered.map((value, index) => (
            <PatternTile key={`${value}-${index}`} value={value} hidden={phase !== "SHOW"} />
          ))}
        </div>
      </div>

      {phase === "INPUT" || phase === "DONE" ? (
        <div className="mt-3 space-y-2">
          {challenge.options.map((option, index) => (
            <button
              key={index}
              type="button"
              onClick={() => choose(index)}
              disabled={disabled || phase !== "INPUT"}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left shadow-sm transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="flex flex-wrap gap-2">
                {option.map((value, optionIndex) => (
                  <PatternTile key={`${index}-${optionIndex}-${value}`} value={value} />
                ))}
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
