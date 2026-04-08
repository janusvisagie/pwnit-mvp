"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { GameProps } from "../types";

type Option = { id: string; label: string; emoji: string };

type LocalTarget = {
  id: string;
  label: string;
  emoji: string;
  accent: string;
  clues: string[];
  category: string;
};

type Challenge = {
  game?: "clue-ladder";
  answerId?: string;
  options?: Option[];
  clues?: string[];
  totalClues?: number;
  attemptId?: string;
};

const LOCAL_TARGETS: LocalTarget[] = [
  {
    id: "fuel-voucher",
    label: "Fuel Voucher",
    emoji: "⛽",
    accent: "bg-amber-100 text-amber-900 ring-amber-200",
    category: "Travel support",
    clues: [
      "This prize is practical rather than flashy.",
      "It helps with a cost linked to transport.",
      "You would likely use it during a road trip.",
      "It belongs closer to a forecourt than a checkout aisle.",
      "It is redeemed while refuelling a vehicle.",
      "It is a Fuel Voucher.",
    ],
  },
  {
    id: "checkers-voucher",
    label: "Checkers Voucher",
    emoji: "🛒",
    accent: "bg-lime-100 text-lime-900 ring-lime-200",
    category: "Household essentials",
    clues: [
      "This prize supports regular household spending.",
      "It belongs near a trolley, not a gadget desk.",
      "It is more about essentials than entertainment.",
      "It suits milk, bread, and pantry basics.",
      "It is redeemed at a grocery retailer.",
      "It is a Checkers Voucher.",
    ],
  },
  {
    id: "takealot-voucher",
    label: "Takealot Voucher",
    emoji: "📦",
    accent: "bg-sky-100 text-sky-900 ring-sky-200",
    category: "Online shopping",
    clues: [
      "This prize rewards convenience.",
      "It points to delivery rather than collection.",
      "It is redeemed online rather than at a till.",
      "It suits people who like shopping from home.",
      "It belongs with a major e-commerce store.",
      "It is a Takealot Voucher.",
    ],
  },
  {
    id: "headphones",
    label: "Headphones",
    emoji: "🎧",
    accent: "bg-fuchsia-100 text-fuchsia-900 ring-fuchsia-200",
    category: "Personal audio",
    clues: [
      "This prize is worn while using it.",
      "It improves a personal media experience.",
      "It helps you focus on what you hear.",
      "It belongs with playlists, podcasts, and calls.",
      "It sits over or around your ears.",
      "It is Headphones.",
    ],
  },
  {
    id: "switch",
    label: "Nintendo Switch",
    emoji: "🎮",
    accent: "bg-red-100 text-red-900 ring-red-200",
    category: "Gaming",
    clues: [
      "This prize is built for play rather than work.",
      "It can move between handheld and docked use.",
      "It comes with detachable controls.",
      "It suits solo or couch gaming.",
      "It is Nintendo’s hybrid console.",
      "It is a Nintendo Switch.",
    ],
  },
  {
    id: "camera",
    label: "GoPro Camera",
    emoji: "📷",
    accent: "bg-cyan-100 text-cyan-900 ring-cyan-200",
    category: "Adventure capture",
    clues: [
      "This prize is designed for capturing motion.",
      "It suits outdoor or action use.",
      "It is often mounted or clipped on.",
      "It is made for footage rather than listening.",
      "It is a compact action camera.",
      "It is a GoPro Camera.",
    ],
  },
  {
    id: "bonus-credits",
    label: "Bonus Credits",
    emoji: "⭐",
    accent: "bg-violet-100 text-violet-900 ring-violet-200",
    category: "Platform reward",
    clues: [
      "This reward keeps you in the game.",
      "It is not shipped to you in a box.",
      "It matters inside the platform itself.",
      "It gives you more room for another run.",
      "It helps you play again without a delivery.",
      "It is Bonus Credits.",
    ],
  },
  {
    id: "podium-place",
    label: "Podium Place",
    emoji: "🏆",
    accent: "bg-yellow-100 text-yellow-900 ring-yellow-200",
    category: "Competitive finish",
    clues: [
      "This is a result, not a physical item.",
      "Players chase it for status and rank.",
      "It lives near the top of the leaderboard.",
      "It means finishing ahead of most people.",
      "It is where winners stand.",
      "It is a Podium Place.",
    ],
  },
];

const BASE_ROUND_SCORE = 17600;
const BASE_ROUND_TIME_MS = 15000;
const MIN_ROUND_TIME_MS = 7500;

function shuffle<T>(values: readonly T[]) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function buildLocalChallenge(): Challenge {
  const correct = LOCAL_TARGETS[Math.floor(Math.random() * LOCAL_TARGETS.length)]!;
  const options = shuffle([
    correct,
    ...shuffle(LOCAL_TARGETS.filter((entry) => entry.id !== correct.id)).slice(0, 5),
  ]).map(({ id, label, emoji }) => ({ id, label, emoji }));
  return {
    game: "clue-ladder",
    answerId: correct.id,
    options,
    clues: correct.clues,
    totalClues: correct.clues.length,
  };
}

function getLocalTarget(id?: string | null) {
  return LOCAL_TARGETS.find((entry) => entry.id === id) ?? null;
}

function buildExtendedOptions(options: Option[]) {
  if (options.length >= 6) return options;
  const existingIds = new Set(options.map((option) => option.id));
  const extras = shuffle(LOCAL_TARGETS.filter((entry) => !existingIds.has(entry.id)))
    .slice(0, Math.max(0, 6 - options.length))
    .map(({ id, label, emoji }) => ({ id, label, emoji }));
  return shuffle([...options, ...extras]);
}

export default function ClueLadderGame({ onFinish, disabled, challenge: injectedChallenge }: GameProps<Challenge>) {
  const verifiedMode = Boolean(injectedChallenge?.attemptId);
  const [localChallenge, setLocalChallenge] = useState<Challenge>(() => buildLocalChallenge());
  const challenge = injectedChallenge ?? localChallenge;
  const options = useMemo(() => buildExtendedOptions(challenge.options ?? []), [challenge.options]);
  const totalClues = challenge.totalClues ?? challenge.clues?.length ?? 6;

  const [phase, setPhase] = useState<"READY" | "RUNNING" | "DONE">("READY");
  const [clues, setClues] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [level, setLevel] = useState(1);
  const [runScore, setRunScore] = useState(0);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const roundEndsAtRef = useRef<number | null>(null);

  const roundTimeMs = verifiedMode ? null : Math.max(MIN_ROUND_TIME_MS, BASE_ROUND_TIME_MS - (level - 1) * 900);

  useEffect(() => {
    if (!verifiedMode) return;
    setPhase("READY");
    setClues([]);
    setMessage(null);
    setPending(false);
    setLevel(1);
    setRunScore(0);
    setFinalScore(null);
    setRemainingMs(null);
    startedAtRef.current = null;
    roundEndsAtRef.current = null;
  }, [challenge.attemptId, verifiedMode]);

  useEffect(() => {
    if (phase !== "RUNNING" || roundEndsAtRef.current == null) return undefined;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, roundEndsAtRef.current! - Date.now());
      setRemainingMs(remaining);
      if (remaining <= 0 && !verifiedMode) {
        window.clearInterval(timer);
        finishRun(false, "Time up.");
      }
    }, 120);
    return () => window.clearInterval(timer);
  }, [phase, verifiedMode, level]);

  function startRound(nextChallenge?: Challenge, nextLevel?: number, nextRunScore?: number) {
    if (!verifiedMode && nextChallenge) setLocalChallenge(nextChallenge);
    if (typeof nextLevel === "number") setLevel(nextLevel);
    if (typeof nextRunScore === "number") setRunScore(nextRunScore);
    setPhase("RUNNING");
    setClues([]);
    setPending(false);
    setFinalScore(null);
    setMessage("The first clue appears immediately. Solve early for the strongest score.");
    startedAtRef.current = Date.now();
    if (!verifiedMode && roundTimeMs != null) {
      roundEndsAtRef.current = Date.now() + roundTimeMs;
      setRemainingMs(roundTimeMs);
    } else {
      roundEndsAtRef.current = null;
      setRemainingMs(null);
    }
    void revealNext(true);
  }

  function start() {
    if (disabled) return;
    if (verifiedMode) {
      startRound(undefined, 1, 0);
      return;
    }
    startRound(buildLocalChallenge(), 1, 0);
  }

  async function revealNext(silent = false) {
    if (disabled || pending || phase !== "RUNNING" || clues.length >= totalClues) return;
    if (!verifiedMode) {
      const next = (challenge.clues ?? []).slice(0, clues.length + 1);
      setClues(next);
      if (!silent) {
        setMessage(next.length >= totalClues ? "That is the final clue. Make your choice." : "Another clue unlocked.");
      }
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
        setMessage(data?.error || `Could not reveal the next clue (${res.status})`);
        return;
      }
      const nextClues = Array.isArray(data.clues) ? data.clues.map((value: unknown) => String(value || "")) : [];
      setClues(nextClues);
      if (!silent) {
        setMessage(data.exhausted ? "That is the final clue. Make your choice." : "Another clue unlocked.");
      }
    } catch (e: any) {
      setMessage(e?.message || "Could not reveal the next clue.");
    } finally {
      setPending(false);
    }
  }

  function finishRun(correct: boolean, customMessage?: string, selectedId?: string) {
    const elapsedMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));

    if (verifiedMode) {
      const scoreMs = correct ? Math.max(1200, BASE_ROUND_SCORE - elapsedMs - Math.max(0, clues.length - 1) * 2100) : 0;
      setPhase("DONE");
      setFinalScore(scoreMs);
      setMessage(
        customMessage ??
          (correct
            ? "Answer locked in. The server will score your run using clue depth and elapsed time."
            : "Wrong answer."),
      );
      onFinish({
        scoreMs,
        meta: {
          game: "clue-ladder",
          selectedId,
          elapsedMs,
          serverProgress: true,
        },
      });
      return;
    }

    if (!correct) {
      setPhase("DONE");
      setFinalScore(runScore);
      setRemainingMs(0);
      setMessage(customMessage ?? `Run over. You cleared ${Math.max(0, level - 1)} round${level - 1 === 1 ? "" : "s"}.`);
      onFinish({
        scoreMs: runScore,
        meta: {
          game: "clue-ladder",
          roundsCleared: Math.max(0, level - 1),
          levelReached: level,
          elapsedMs,
        },
      });
      return;
    }

    const roundScore = Math.max(900, BASE_ROUND_SCORE - elapsedMs - Math.max(0, clues.length - 1) * 1700 - (level - 1) * 250);
    const nextRunScore = runScore + roundScore;
    const nextLevel = level + 1;
    startRound(buildLocalChallenge(), nextLevel, nextRunScore);
    setMessage(`Correct. Level ${nextLevel} begins now.`);
  }

  function choose(id: string) {
    if (disabled || pending || phase !== "RUNNING") return;
    const correct = id === challenge.answerId;
    finishRun(correct, correct ? undefined : "Wrong answer. The run ends here.", id);
  }

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objective</div>
          <h3 className="mt-1 text-base font-black text-slate-950 sm:text-lg">Clue Ladder</h3>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Start the run and the first clue appears immediately. Read the clues, then choose the correct answer option below. Fewer clues and quicker correct answers earn stronger scores.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!verifiedMode ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">Level {level}</span>
          ) : null}
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            Clues {clues.length} / {totalClues}
          </span>
          {!verifiedMode && remainingMs != null ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
              {Math.max(0, Math.ceil(remainingMs / 1000))}s
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 rounded-[28px] border border-slate-200 bg-slate-50 p-3 sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Unlocked clues</div>
            <div className="mt-3 space-y-2">
              {Array.from({ length: totalClues }, (_, index) => {
                const clue = clues[index];
                return (
                  <div
                    key={index}
                    className={`rounded-2xl border px-3 py-3 text-sm ${
                      clue ? "border-sky-200 bg-sky-50 text-sky-900" : "border-slate-200 bg-slate-50 text-slate-400"
                    }`}
                  >
                    {clue || `Hidden clue ${index + 1}`}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">How to win this round</div>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p>Read the clue trail as it builds.</p>
              <p>Pick the answer option that best fits all revealed clues.</p>
              <p>Guess early if you are confident — each extra clue lowers the potential score.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={start}
          disabled={disabled || pending || phase === "RUNNING"}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          {phase === "READY" ? "Start clue ladder" : verifiedMode ? "Play again" : "Replay with a fresh run"}
        </button>
        <button
          type="button"
          onClick={() => void revealNext(false)}
          disabled={disabled || pending || phase !== "RUNNING" || clues.length >= totalClues}
          className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {pending ? "Revealing..." : clues.length >= totalClues ? "All clues shown" : "Reveal another clue"}
        </button>
        {!verifiedMode ? (
          <span className="rounded-2xl bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800 ring-1 ring-emerald-200">
            Run score {runScore.toLocaleString("en-ZA")}
          </span>
        ) : null}
      </div>

      <div className="mt-5">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Choose the best answer option</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {options.map((option) => {
            const visual = getLocalTarget(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => choose(option.id)}
                disabled={disabled || pending || phase !== "RUNNING"}
                className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-3xl">{option.emoji || visual?.emoji || "❖"}</div>
                    <div className="mt-3 text-base font-black text-slate-950">{option.label}</div>
                    <div className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {visual?.category ?? "Prize option"}
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${visual?.accent ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}>
                    Option
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {message ? (
        <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">{message}</div>
      ) : null}

      {finalScore != null ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
          Final score {finalScore.toLocaleString("en-ZA")} · Rounds cleared {Math.max(0, level - 1)}
        </div>
      ) : null}
    </div>
  );
}
