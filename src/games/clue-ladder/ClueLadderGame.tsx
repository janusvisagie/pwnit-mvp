"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { GameProps } from "../types";

type Option = { id: string; label: string; emoji: string };

type Challenge = {
  game?: "clue-ladder";
  answerId?: string;
  options?: Option[];
  clues?: string[];
  totalClues?: number;
  attemptId?: string;
};

const CLUE_BANK: Array<{ id: string; label: string; emoji: string; clues: string[] }> = [
  {
    id: "fuel-voucher",
    label: "Fuel Voucher",
    emoji: "⛽",
    clues: [
      "This prize is practical rather than flashy.",
      "It helps with a cost linked to transport.",
      "You use it before or during a road trip.",
      "It is redeemed at a filling station.",
    ],
  },
  {
    id: "checkers-voucher",
    label: "Checkers Voucher",
    emoji: "🛒",
    clues: [
      "This prize is more about essentials than entertainment.",
      "It belongs near a trolley, not a gadget shelf.",
      "It helps with regular household spending.",
      "It is redeemed at a grocery retailer.",
    ],
  },
  {
    id: "takealot-voucher",
    label: "Takealot Voucher",
    emoji: "📦",
    clues: [
      "This prize suits people who like convenience.",
      "It points to delivery rather than collection.",
      "It is used online rather than at a till.",
      "It belongs with a well-known e-commerce store.",
    ],
  },
  {
    id: "headphones",
    label: "Headphones",
    emoji: "🎧",
    clues: [
      "This prize is worn rather than carried while using it.",
      "It improves a personal media experience.",
      "It helps you focus on what you hear.",
      "It sits over your ears.",
    ],
  },
  {
    id: "switch",
    label: "Nintendo Switch",
    emoji: "🎮",
    clues: [
      "This prize is built for play rather than work.",
      "It can move between handheld and docked use.",
      "It comes with detachable controls.",
      "It is Nintendo’s hybrid console.",
    ],
  },
  {
    id: "camera",
    label: "GoPro Camera",
    emoji: "📷",
    clues: [
      "This prize is made for capturing moments.",
      "It suits movement and outdoor use.",
      "It is often mounted or carried on adventures.",
      "It is a compact action camera.",
    ],
  },
];
const MAX_SCORE = 25000;

function shuffle<T>(values: readonly T[]) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function buildChallenge(): Challenge {
  const correct = CLUE_BANK[Math.floor(Math.random() * CLUE_BANK.length)]!;
  const options = shuffle([
    correct,
    ...shuffle(CLUE_BANK.filter((entry) => entry.id !== correct.id)).slice(0, 3),
  ]).map(({ id, label, emoji }) => ({ id, label, emoji }));

  return {
    game: "clue-ladder",
    answerId: correct.id,
    options,
    clues: correct.clues,
    totalClues: correct.clues.length,
  };
}

export default function ClueLadderGame({ onFinish, disabled, challenge: injectedChallenge }: GameProps<Challenge>) {
  const challenge = useMemo(() => injectedChallenge ?? buildChallenge(), [injectedChallenge]);
  const verifiedMode = Boolean(challenge.attemptId);
  const options = challenge.options ?? [];
  const totalClues = challenge.totalClues ?? challenge.clues?.length ?? 4;

  const [phase, setPhase] = useState<"READY" | "RUNNING" | "DONE">("READY");
  const [clues, setClues] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    setPhase("READY");
    setClues([]);
    setMessage(null);
    setScore(null);
    setPending(false);
    startedAtRef.current = null;
  }, [challenge.attemptId]);

  function start() {
    if (disabled) return;
    setPhase("RUNNING");
    setClues([]);
    setMessage(
      verifiedMode
        ? "The answer is hidden until you start. Reveal clues one at a time and solve before you need the lower rungs of the ladder."
        : "Reveal clues one at a time and solve before you need too many rungs of the ladder.",
    );
    setScore(null);
    setPending(false);
    startedAtRef.current = Date.now();
  }

  async function revealNext() {
    if (disabled || pending || phase !== "RUNNING" || clues.length >= totalClues) return;
    if (!verifiedMode) {
      const next = (challenge.clues ?? []).slice(0, clues.length + 1);
      setClues(next);
      setMessage(next.length >= totalClues ? "That is the final clue. Lock in your answer." : "One more clue unlocked.");
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
        setMessage(data?.error || `Could not unlock a clue (${res.status})`);
        return;
      }
      const nextClues = Array.isArray(data.clues) ? data.clues.map((value: unknown) => String(value || "")) : [];
      setClues(nextClues);
      setMessage(data.exhausted ? "That is the final clue. Lock in your answer." : "One more clue unlocked.");
    } catch (e: any) {
      setMessage(e?.message || "Could not unlock a clue.");
    } finally {
      setPending(false);
    }
  }

  function choose(id: string) {
    if (disabled || pending || phase !== "RUNNING") return;
    const elapsedMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));
    const solved = !verifiedMode ? id === challenge.answerId : true;
    const provisionalScore = solved ? Math.max(1200, MAX_SCORE - elapsedMs - Math.max(0, clues.length - 1) * 2600) : 0;
    setPhase("DONE");
    setScore(provisionalScore);
    setMessage(
      verifiedMode
        ? "Answer locked in. The server will score your run using the clue depth and elapsed time."
        : solved
          ? "Correct answer."
          : "Wrong answer.",
    );
    onFinish({
      scoreMs: provisionalScore,
      meta: {
        game: "clue-ladder",
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
          <h3 className="mt-1 text-base font-black text-slate-950 sm:text-lg">Clue Ladder</h3>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          Clues {clues.length} / {totalClues}
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        Unlock clues one by one and solve as early as you can. Every extra clue makes the answer easier, but it trims your score.
      </p>
      <p className="mt-1 text-xs text-slate-500">
        The hidden answer is not shown before the run starts. Replay starts a brand-new challenge.
      </p>

      <div className="mt-3 grid gap-2">
        {Array.from({ length: totalClues }, (_, index) => {
          const clue = clues[index];
          return (
            <div
              key={index}
              className={`rounded-2xl border px-4 py-3 text-sm ${clue ? "border-slate-200 bg-white text-slate-800" : "border-dashed border-slate-200 bg-slate-50 text-slate-400"}`}
            >
              {clue ? clue : `Locked clue ${index + 1}`}
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
          {phase === "READY" ? "Start Clue Ladder" : "Replay"}
        </button>
        <button
          type="button"
          onClick={() => void revealNext()}
          disabled={disabled || pending || phase !== "RUNNING" || clues.length >= totalClues}
          className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {pending ? "Unlocking..." : clues.length >= totalClues ? "All clues shown" : "Unlock next clue"}
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
