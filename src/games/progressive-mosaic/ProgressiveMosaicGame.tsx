"use client";

import { useEffect, useRef, useState } from "react";

import type { GameProps } from "../types";

type Option = { id: string; label: string; emoji: string };

type Challenge = {
  game?: "progressive-mosaic";
  answerId?: string;
  options?: Option[];
  reveals?: string[];
  maxReveals?: number;
  attemptId?: string;
};

const MOSAIC_BANK: Array<{ id: string; label: string; emoji: string; reveals: string[] }> = [
  {
    id: "fuel-voucher",
    label: "Fuel Voucher",
    emoji: "⛽",
    reveals: ["Road expense", "Pump handle", "Trip essential", "Used when refuelling"],
  },
  {
    id: "checkers-voucher",
    label: "Checkers Voucher",
    emoji: "🛒",
    reveals: ["Household essentials", "Trolley aisle", "Weekly shop", "Groceries and basics"],
  },
  {
    id: "takealot-voucher",
    label: "Takealot Voucher",
    emoji: "📦",
    reveals: ["Checkout at home", "Delivery box", "Online order", "Redeemed on a shopping site"],
  },
  {
    id: "headphones",
    label: "Headphones",
    emoji: "🎧",
    reveals: ["Private listening", "Over the ears", "Sound focus", "Music without speakers"],
  },
  {
    id: "switch",
    label: "Nintendo Switch",
    emoji: "🎮",
    reveals: ["Portable play", "Detachable controls", "Dock or handheld", "Nintendo hybrid console"],
  },
  {
    id: "camera",
    label: "GoPro Camera",
    emoji: "📷",
    reveals: ["Adventure footage", "Mounted outdoors", "Compact action camera", "Built for motion clips"],
  },
];
const MAX_SCORE = 26000;

function shuffle<T>(values: readonly T[]) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function buildChallenge(): Challenge {
  const correct = MOSAIC_BANK[Math.floor(Math.random() * MOSAIC_BANK.length)]!;
  const options = shuffle([
    correct,
    ...shuffle(MOSAIC_BANK.filter((entry) => entry.id !== correct.id)).slice(0, 3),
  ]).map(({ id, label, emoji }) => ({ id, label, emoji }));

  return {
    game: "progressive-mosaic",
    answerId: correct.id,
    options,
    reveals: correct.reveals,
    maxReveals: correct.reveals.length,
  };
}

export default function ProgressiveMosaicGame({ onFinish, disabled, challenge: injectedChallenge }: GameProps<Challenge>) {
  const verifiedMode = Boolean(injectedChallenge?.attemptId);
  const [localChallenge, setLocalChallenge] = useState<Challenge>(() => buildChallenge());
  const challenge = injectedChallenge ?? localChallenge;
  const options = challenge.options ?? [];
  const maxReveals = challenge.maxReveals ?? challenge.reveals?.length ?? 4;

  const [phase, setPhase] = useState<"READY" | "RUNNING" | "DONE">("READY");
  const [reveals, setReveals] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!verifiedMode) return;
    setPhase("READY");
    setReveals([]);
    setMessage(null);
    setScore(null);
    setPending(false);
    startedAtRef.current = null;
  }, [challenge.attemptId, verifiedMode]);

  function resetForRun(nextLocalChallenge?: Challenge) {
    if (!verifiedMode && nextLocalChallenge) {
      setLocalChallenge(nextLocalChallenge);
    }
    setPhase("RUNNING");
    setReveals([]);
    setMessage(
      verifiedMode
        ? "Start the run, reveal the hidden mosaic one step at a time, then choose the correct answer tile below."
        : "Reveal the hidden mosaic one step at a time, then choose the correct answer tile below.",
    );
    setScore(null);
    setPending(false);
    startedAtRef.current = Date.now();
  }

  function start() {
    if (disabled) return;
    const nextLocal = !verifiedMode && phase !== "READY" ? buildChallenge() : undefined;
    resetForRun(nextLocal);
  }

  async function revealNext() {
    if (disabled || pending || phase !== "RUNNING" || reveals.length >= maxReveals) return;
    if (!verifiedMode) {
      const next = (challenge.reveals ?? []).slice(0, reveals.length + 1);
      setReveals(next);
      setMessage(next.length >= maxReveals ? "That is the final reveal. Choose the matching answer tile." : "One more part of the hidden mosaic is now visible.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/attempt/progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId: challenge.attemptId, action: "reveal" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setMessage(data?.error || `Could not reveal the next part (${res.status})`);
        return;
      }
      const nextReveals = Array.isArray(data.reveals) ? data.reveals.map((value: unknown) => String(value || "")) : [];
      setReveals(nextReveals);
      setMessage(data.exhausted ? "That is the final reveal. Choose the matching answer tile." : "One more part of the hidden mosaic is now visible.");
    } catch (e: any) {
      setMessage(e?.message || "Could not reveal the next part.");
    } finally {
      setPending(false);
    }
  }

  function choose(id: string) {
    if (disabled || pending || phase !== "RUNNING") return;
    const elapsedMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));
    const solved = !verifiedMode ? id === challenge.answerId : true;
    const provisionalScore = solved ? Math.max(1200, MAX_SCORE - elapsedMs - reveals.length * 3200) : 0;
    setPhase("DONE");
    setScore(provisionalScore);
    setMessage(
      verifiedMode
        ? "Answer locked in. The server will score your run using the reveal depth and elapsed time."
        : solved
          ? "Correct answer."
          : "Wrong answer.",
    );
    onFinish({
      scoreMs: provisionalScore,
      meta: {
        game: "progressive-mosaic",
        selectedId: id,
        elapsedMs,
        serverProgress: verifiedMode,
      },
    });
  }

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objective</div>
          <h3 className="mt-1 text-base font-black text-slate-950 sm:text-lg">Progressive Mosaic</h3>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          Reveals {reveals.length} / {maxReveals}
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        Start the run, reveal the hidden prize clue-card one step at a time, then select the correct answer tile below.
      </p>
      <p className="mt-1 text-xs text-slate-500">
        The answer tile is never shown directly inside the reveals. Fewer reveals and a faster correct answer give a better score.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: maxReveals }, (_, index) => {
          const tile = reveals[index];
          return (
            <div
              key={index}
              className="flex min-h-[70px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-4 text-center text-sm font-bold text-slate-800"
            >
              {tile ? tile : <span className="text-xl text-slate-300">◼</span>}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={start}
          disabled={disabled || pending || phase === "RUNNING"}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          {phase === "READY" ? "Start Progressive Mosaic" : "Replay"}
        </button>
        <button
          type="button"
          onClick={() => void revealNext()}
          disabled={disabled || pending || phase !== "RUNNING" || reveals.length >= maxReveals}
          className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {pending ? "Revealing..." : reveals.length >= maxReveals ? "All reveals shown" : "Reveal next clue"}
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => choose(option.id)}
            disabled={disabled || pending || phase !== "RUNNING"}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <div className="text-xl">{option.emoji}</div>
            <div className="mt-1 text-sm font-black text-slate-950">{option.label}</div>
          </button>
        ))}
      </div>

      {message ? (
        <div className="mt-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">{message}</div>
      ) : null}

      {score != null ? (
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
          Score {score.toLocaleString("en-ZA")}
        </div>
      ) : null}
    </div>
  );
}
