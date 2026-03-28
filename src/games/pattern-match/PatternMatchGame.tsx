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
] as const;

const SHOW_MS = 1800;
const MAX_SCORE = 22000;

type Challenge = {
  game?: "pattern-match";
  ordered: string[];
  options: string[][];
  correctIndex: number;
};

type TileSkin = {
  icon: string;
  code: string;
  shell: string;
  chip: string;
  accent: string;
};

const TILE_SKINS: Record<string, TileSkin> = {
  Pick: { icon: "🎯", code: "PK", shell: "from-indigo-500 via-sky-500 to-cyan-400", chip: "bg-white/20", accent: "bg-cyan-100/90" },
  Play: { icon: "🎮", code: "PL", shell: "from-fuchsia-500 via-violet-500 to-indigo-500", chip: "bg-white/20", accent: "bg-violet-100/90" },
  PwnIt: { icon: "🏆", code: "PW", shell: "from-amber-500 via-orange-500 to-rose-500", chip: "bg-white/20", accent: "bg-amber-100/90" },
  Prize: { icon: "🎁", code: "PR", shell: "from-emerald-500 via-teal-500 to-cyan-500", chip: "bg-white/20", accent: "bg-emerald-100/90" },
  Bonus: { icon: "⭐", code: "BN", shell: "from-rose-500 via-pink-500 to-fuchsia-500", chip: "bg-white/20", accent: "bg-pink-100/90" },
  Credit: { icon: "💳", code: "CR", shell: "from-slate-700 via-slate-600 to-slate-500", chip: "bg-white/15", accent: "bg-slate-200/90" },
  Boost: { icon: "🚀", code: "BS", shell: "from-orange-500 via-red-500 to-pink-500", chip: "bg-white/20", accent: "bg-orange-100/90" },
  Target: { icon: "🧭", code: "TG", shell: "from-sky-500 via-blue-500 to-indigo-500", chip: "bg-white/20", accent: "bg-sky-100/90" },
  Podium: { icon: "🥇", code: "PD", shell: "from-yellow-500 via-amber-500 to-orange-500", chip: "bg-white/20", accent: "bg-yellow-100/90" },
  Voucher: { icon: "🧾", code: "VC", shell: "from-teal-500 via-emerald-500 to-lime-500", chip: "bg-white/20", accent: "bg-lime-100/90" },
  Unlock: { icon: "🔓", code: "UL", shell: "from-violet-500 via-purple-500 to-fuchsia-500", chip: "bg-white/20", accent: "bg-purple-100/90" },
  Winner: { icon: "👑", code: "WN", shell: "from-amber-500 via-yellow-500 to-lime-400", chip: "bg-white/20", accent: "bg-yellow-100/90" },
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
    ordered: [...ordered],
    options: options.map((entry) => [...entry]),
    correctIndex: options.findIndex((entry) => entry.every((word, index) => word === ordered[index])),
  };
}

function PatternTile({ value, hidden = false }: { value: string; hidden?: boolean }) {
  const skin = TILE_SKINS[value] ?? TILE_SKINS.PwnIt;
  if (hidden) {
    return (
      <div className="relative h-16 w-12 overflow-hidden rounded-2xl border border-slate-200 bg-slate-200/80 shadow-sm sm:h-[68px] sm:w-[52px]">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-200 to-slate-300" />
        <div className="absolute left-2 top-2 h-4 w-4 rounded-lg bg-white/60" />
        <div className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-white/70" />
        <div className="absolute bottom-2 left-2 right-2 h-2 rounded-full bg-white/65" />
      </div>
    );
  }

  return (
    <div className={`relative h-16 w-12 overflow-hidden rounded-2xl border border-white/30 bg-gradient-to-br ${skin.shell} shadow-sm sm:h-[68px] sm:w-[52px]`}>
      <div className="absolute inset-x-0 bottom-0 h-5 bg-black/10" />
      <div className="absolute left-2 top-2 h-4 w-4 rounded-lg border border-white/40 bg-white/20" />
      <div className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-white/75" />
      <div className="flex h-full flex-col justify-between p-2 text-white">
        <div className="text-lg leading-none drop-shadow-sm">{skin.icon}</div>
        <div className="space-y-1">
          <div className={`h-1.5 w-5 rounded-full ${skin.accent}`} />
          <div className={`inline-flex rounded-full px-1.5 py-0.5 text-[8px] font-black tracking-[0.18em] text-slate-900 ${skin.chip}`}>
            {skin.code}
          </div>
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

        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          Visual strip
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        Watch the strip, then choose the option that matches exactly in the same order.
      </p>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Shown pattern</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {(phase === "SHOW" ? challenge.ordered : challenge.ordered).map((value, index) => (
            <PatternTile key={`${value}-${index}`} value={value} hidden={phase !== "SHOW"} />
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
              className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <div className="flex flex-wrap gap-2">
                {option.map((value, tileIndex) => (
                  <PatternTile key={`${index}-${value}-${tileIndex}`} value={value} />
                ))}
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {message ? <div className="mt-3 text-sm font-semibold text-slate-700">{message}</div> : null}
      {score !== null ? <div className="mt-1 text-sm text-slate-600">Score {score}</div> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => start(phase === "DONE")}
          disabled={disabled}
          className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {phase === "READY" ? "Start Pattern Match" : "Replay"}
        </button>
      </div>
    </div>
  );
}
