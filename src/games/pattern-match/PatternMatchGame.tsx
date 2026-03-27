"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { GameProps } from "../types";

const PATTERN_TILE_IDS = [
  "headset-boost",
  "camera-drop",
  "voucher-stack",
  "gift-burst",
  "credit-ring",
  "cart-flash",
  "crown-rank",
  "console-spark",
  "parcel-rush",
  "prize-shine",
  "shield-check",
  "bolt-badge",
] as const;

const TILE_META: Record<(typeof PATTERN_TILE_IDS)[number], { icon: string; tint: string; accent: string; label: string }> = {
  "headset-boost": { icon: "🎧", tint: "from-cyan-500 to-sky-400", accent: "★", label: "Headset" },
  "camera-drop": { icon: "📷", tint: "from-orange-500 to-amber-400", accent: "▲", label: "Camera" },
  "voucher-stack": { icon: "🎟️", tint: "from-emerald-500 to-lime-400", accent: "✦", label: "Voucher" },
  "gift-burst": { icon: "🎁", tint: "from-fuchsia-500 to-pink-400", accent: "✚", label: "Prize Box" },
  "credit-ring": { icon: "🪙", tint: "from-yellow-500 to-amber-300", accent: "◎", label: "Credits" },
  "cart-flash": { icon: "🛒", tint: "from-blue-600 to-indigo-400", accent: "⚡", label: "Checkout" },
  "crown-rank": { icon: "👑", tint: "from-violet-600 to-fuchsia-400", accent: "◆", label: "Rank" },
  "console-spark": { icon: "🎮", tint: "from-slate-700 to-slate-500", accent: "✦", label: "Console" },
  "parcel-rush": { icon: "📦", tint: "from-rose-600 to-orange-400", accent: "↗", label: "Delivery" },
  "prize-shine": { icon: "🏆", tint: "from-amber-500 to-yellow-300", accent: "✦", label: "Trophy" },
  "shield-check": { icon: "🛡️", tint: "from-teal-600 to-cyan-400", accent: "✓", label: "Verified" },
  "bolt-badge": { icon: "⚡", tint: "from-indigo-600 to-sky-400", accent: "●", label: "Boost" },
};

const SHOW_MS = 1800;
const MAX_SCORE = 22000;

type TileId = (typeof PATTERN_TILE_IDS)[number];

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
  const ordered = shuffle(PATTERN_TILE_IDS).slice(0, 4) as unknown as string[];
  const distractorA = [...ordered];
  [distractorA[1], distractorA[2]] = [distractorA[2]!, distractorA[1]!];
  const distractorB = [...ordered];
  [distractorB[0], distractorB[3]] = [distractorB[3]!, distractorB[0]!];
  const options = shuffle([ordered, distractorA, distractorB]);
  return {
    game: "pattern-match",
    ordered,
    options,
    correctIndex: options.findIndex((entry) => entry.every((value, index) => value === ordered[index])),
  };
}

function TileVisual({ id, hidden = false }: { id: string; hidden?: boolean }) {
  const meta = TILE_META[id as TileId];

  if (hidden || !meta) {
    return (
      <div className="flex h-[4.4rem] w-[4.1rem] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-100 text-xl font-black text-slate-400 sm:h-[4.8rem] sm:w-[4.4rem]">
        •
      </div>
    );
  }

  return (
    <div className="relative h-[4.4rem] w-[4.1rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:h-[4.8rem] sm:w-[4.4rem]">
      <div className={`absolute inset-x-0 top-0 h-11 bg-gradient-to-br ${meta.tint}`} />
      <div className="absolute right-1.5 top-1.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-black text-slate-700">
        {meta.accent}
      </div>
      <div className="absolute left-1/2 top-[1.95rem] -translate-x-1/2 -translate-y-1/2 text-2xl drop-shadow-sm">{meta.icon}</div>
      <div className="absolute inset-x-0 bottom-0 px-1.5 py-1 text-center text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">
        {meta.label}
      </div>
    </div>
  );
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
      setMessage("Pick the image strip that matches exactly.");
    }, SHOW_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  function start() {
    if (disabled) return;
    setPhase("SHOW");
    setMessage("Watch the image strip closely.");
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
    setMessage(correct ? "Exact image match." : "Not that strip.");

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
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">4-image strip</div>
      </div>

      <p className="mt-2 text-sm text-slate-600">Watch the strip, then choose the option that matches it exactly in the same order.</p>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Shown pattern</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {(phase === "SHOW" ? challenge.ordered : Array.from({ length: challenge.ordered.length }, () => "hidden" as const)).map((tileId, index) => (
            <TileVisual key={`${tileId}-${index}`} id={tileId} hidden={tileId === "hidden"} />
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
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:-translate-y-0.5 hover:border-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-700">
                  {String.fromCharCode(65 + index)}
                </span>
                <div className="flex flex-wrap gap-2">
                  {option.map((tileId, optionIndex) => (
                    <TileVisual key={`${index}-${tileId}-${optionIndex}`} id={tileId} />
                  ))}
                </div>
              </div>
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
