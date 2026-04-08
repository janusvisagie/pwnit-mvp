"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { GameProps } from "../types";

type Option = { id: string; label: string; emoji: string };

type LocalTarget = {
  id: string;
  label: string;
  emoji: string;
  theme: string;
  clues: string[];
};

type Challenge = {
  game?: "progressive-mosaic";
  answerId?: string;
  options?: Option[];
  reveals?: string[];
  maxReveals?: number;
  attemptId?: string;
};

const LOCAL_TARGETS: LocalTarget[] = [
  {
    id: "fuel-voucher",
    label: "Fuel Voucher",
    emoji: "⛽",
    theme: "from-amber-100 via-orange-50 to-rose-100",
    clues: [
      "Travel support",
      "Useful on a road trip",
      "Redeemed before the tank runs low",
      "Used at a filling station",
      "Helps with petrol or diesel costs",
      "Fuel Voucher",
    ],
  },
  {
    id: "checkers-voucher",
    label: "Checkers Voucher",
    emoji: "🛒",
    theme: "from-lime-100 via-emerald-50 to-green-100",
    clues: [
      "Household spending",
      "Everyday essentials",
      "Better with a trolley than a toolbox",
      "Used during a weekly shop",
      "Redeemed in a grocery store",
      "Checkers Voucher",
    ],
  },
  {
    id: "takealot-voucher",
    label: "Takealot Voucher",
    emoji: "📦",
    theme: "from-sky-100 via-blue-50 to-indigo-100",
    clues: [
      "Shopping from home",
      "Convenience first",
      "Clicks before collection",
      "Delivered to your door",
      "Redeemed on an online store",
      "Takealot Voucher",
    ],
  },
  {
    id: "headphones",
    label: "Headphones",
    emoji: "🎧",
    theme: "from-fuchsia-100 via-pink-50 to-rose-100",
    clues: [
      "Personal audio",
      "Private listening",
      "Worn rather than carried",
      "Over-ear comfort",
      "Built for focused sound",
      "Headphones",
    ],
  },
  {
    id: "switch",
    label: "Nintendo Switch",
    emoji: "🎮",
    theme: "from-red-100 via-orange-50 to-yellow-100",
    clues: [
      "Portable play",
      "Detachable controls",
      "Docked or handheld",
      "A gaming prize",
      "Nintendo hybrid console",
      "Nintendo Switch",
    ],
  },
  {
    id: "camera",
    label: "GoPro Camera",
    emoji: "📷",
    theme: "from-cyan-100 via-sky-50 to-blue-100",
    clues: [
      "Outdoor footage",
      "Built for motion",
      "Compact adventure gear",
      "Mounted on the move",
      "Action camera format",
      "GoPro Camera",
    ],
  },
  {
    id: "bonus-credits",
    label: "Bonus Credits",
    emoji: "⭐",
    theme: "from-violet-100 via-purple-50 to-fuchsia-100",
    clues: [
      "Platform reward",
      "Keeps you in the game",
      "Not a physical product",
      "More room for extra runs",
      "Redeemed inside PwnIt",
      "Bonus Credits",
    ],
  },
  {
    id: "podium-place",
    label: "Podium Place",
    emoji: "🏆",
    theme: "from-yellow-100 via-amber-50 to-orange-100",
    clues: [
      "Competitive finish",
      "Rank-related reward",
      "Top-position chasing",
      "Bragging-rights result",
      "Near the very top",
      "Podium Place",
    ],
  },
];

const BASE_ROUND_SCORE = 18000;
const BASE_ROUND_TIME_MS = 14500;
const MIN_ROUND_TIME_MS = 7000;

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
    game: "progressive-mosaic",
    answerId: correct.id,
    options,
    reveals: correct.clues,
    maxReveals: correct.clues.length,
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

export default function ProgressiveMosaicGame({ onFinish, disabled, challenge: injectedChallenge }: GameProps<Challenge>) {
  const verifiedMode = Boolean(injectedChallenge?.attemptId);
  const [localChallenge, setLocalChallenge] = useState<Challenge>(() => buildLocalChallenge());
  const challenge = injectedChallenge ?? localChallenge;
  const answerVisual = getLocalTarget(challenge.answerId);
  const options = useMemo(() => buildExtendedOptions(challenge.options ?? []), [challenge.options]);
  const maxReveals = challenge.maxReveals ?? challenge.reveals?.length ?? 6;

  const [phase, setPhase] = useState<"READY" | "RUNNING" | "DONE">("READY");
  const [reveals, setReveals] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [level, setLevel] = useState(1);
  const [runScore, setRunScore] = useState(0);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const roundEndsAtRef = useRef<number | null>(null);

  const roundTimeMs = verifiedMode
    ? null
    : Math.max(MIN_ROUND_TIME_MS, BASE_ROUND_TIME_MS - (Math.max(1, level) - 1) * 850);

  useEffect(() => {
    if (!verifiedMode) return;
    setPhase("READY");
    setReveals([]);
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

  function startRound(nextLocalChallenge?: Challenge, nextLevel?: number, nextRunScore?: number) {
    if (!verifiedMode && nextLocalChallenge) {
      setLocalChallenge(nextLocalChallenge);
    }
    if (typeof nextLevel === "number") setLevel(nextLevel);
    if (typeof nextRunScore === "number") setRunScore(nextRunScore);

    setPhase("RUNNING");
    setReveals([]);
    setPending(false);
    setFinalScore(null);
    startedAtRef.current = Date.now();
    if (!verifiedMode && roundTimeMs != null) {
      roundEndsAtRef.current = Date.now() + roundTimeMs;
      setRemainingMs(roundTimeMs);
    } else {
      roundEndsAtRef.current = null;
      setRemainingMs(null);
    }
    setMessage("Study the clearing target, then choose the matching prize option below.");
    void revealNext(true);
  }

  function start() {
    if (disabled) return;
    if (verifiedMode) {
      startRound(undefined, 1, 0);
      return;
    }
    const fresh = buildLocalChallenge();
    startRound(fresh, 1, 0);
  }

  async function revealNext(silent = false) {
    if (disabled || pending || phase !== "RUNNING" || reveals.length >= maxReveals) return;
    if (!verifiedMode) {
      const next = (challenge.reveals ?? []).slice(0, reveals.length + 1);
      setReveals(next);
      if (!silent) {
        setMessage(next.length >= maxReveals ? "That is the final reveal. Choose your answer." : "The image cleared a little more.");
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
      const nextReveals = Array.isArray(data.reveals) ? data.reveals.map((value: unknown) => String(value || "")) : [];
      setReveals(nextReveals);
      if (!silent) {
        setMessage(data.exhausted ? "That is the final reveal. Choose the best match." : "The target image is getting clearer.");
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
      const scoreMs = correct ? Math.max(1200, BASE_ROUND_SCORE - elapsedMs - Math.max(0, reveals.length - 1) * 2200) : 0;
      setPhase("DONE");
      setFinalScore(scoreMs);
      setMessage(
        customMessage ??
          (correct
            ? "Answer locked in. The server will score your run using reveal depth and elapsed time."
            : "Wrong answer."),
      );
      onFinish({
        scoreMs,
        meta: {
          game: "progressive-mosaic",
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
          game: "progressive-mosaic",
          roundsCleared: Math.max(0, level - 1),
          levelReached: level,
          elapsedMs,
        },
      });
      return;
    }

    const roundScore = Math.max(900, BASE_ROUND_SCORE - elapsedMs - Math.max(0, reveals.length - 1) * 1800 - (level - 1) * 250);
    const nextRunScore = runScore + roundScore;
    const nextLevel = level + 1;
    const nextLocal = buildLocalChallenge();
    startRound(nextLocal, nextLevel, nextRunScore);
    setMessage(`Correct. Level ${nextLevel} begins now.`);
  }

  function choose(id: string) {
    if (disabled || pending || phase !== "RUNNING") return;
    const correct = id === challenge.answerId;
    finishRun(correct, correct ? undefined : "Wrong answer. The run ends here.", id);
  }

  const heroRevealCount = Math.max(1, reveals.length);
  const blurClass = answerVisual
    ? heroRevealCount >= maxReveals
      ? "blur-0 scale-100"
      : heroRevealCount >= Math.ceil(maxReveals * 0.8)
        ? "blur-[1px] scale-[1.01]"
        : heroRevealCount >= Math.ceil(maxReveals * 0.55)
          ? "blur-[3px] scale-[1.03]"
          : heroRevealCount >= 2
            ? "blur-[6px] scale-[1.06]"
            : "blur-[10px] scale-[1.08]"
    : "blur-[10px] scale-[1.06]";

  const roundsCleared = Math.max(0, level - 1);

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objective</div>
          <h3 className="mt-1 text-base font-black text-slate-950 sm:text-lg">Progressive Mosaic</h3>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Press start and the target image begins to clear immediately. Guess at any time from the answer options below — fewer reveals and quicker correct guesses produce better scores.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!verifiedMode ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">Level {level}</span>
          ) : null}
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            Reveals {reveals.length} / {maxReveals}
          </span>
          {!verifiedMode && remainingMs != null ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
              {Math.max(0, Math.ceil(remainingMs / 1000))}s
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 rounded-[28px] border border-slate-200 bg-slate-50 p-3 sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br ${answerVisual?.theme ?? "from-slate-200 via-slate-100 to-slate-50"} p-5`}>
            <div className="absolute inset-0 bg-white/55 backdrop-blur-[1px]" />
            <div className="relative flex min-h-[220px] flex-col items-center justify-center rounded-[24px] border border-white/60 bg-white/45 px-4 py-6 text-center shadow-sm">
              <div className={`text-6xl transition duration-300 ${blurClass}`}>{answerVisual?.emoji ?? "❖"}</div>
              <div className={`mt-3 text-xl font-black text-slate-950 transition duration-300 ${blurClass}`}>
                {answerVisual?.label ?? "Hidden prize"}
              </div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                The target sharpens as you reveal more
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Revealed so far</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {Array.from({ length: maxReveals }, (_, index) => {
                const clue = reveals[index];
                return (
                  <div
                    key={index}
                    className={`min-h-[64px] rounded-2xl border px-3 py-3 text-center text-sm font-semibold ${
                      clue
                        ? "border-indigo-200 bg-indigo-50 text-indigo-900"
                        : "border-slate-200 bg-slate-50 text-slate-400"
                    }`}
                  >
                    {clue || "Hidden"}
                  </div>
                );
              })}
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
          {phase === "READY" ? "Start progressive mosaic" : verifiedMode ? "Play again" : "Replay with a fresh run"}
        </button>
        <button
          type="button"
          onClick={() => void revealNext(false)}
          disabled={disabled || pending || phase !== "RUNNING" || reveals.length >= maxReveals}
          className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {pending ? "Revealing..." : reveals.length >= maxReveals ? "All reveals shown" : "Reveal more"}
        </button>
        {!verifiedMode ? (
          <span className="rounded-2xl bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-800 ring-1 ring-emerald-200">
            Run score {runScore.toLocaleString("en-ZA")}
          </span>
        ) : null}
      </div>

      <div className="mt-5">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Choose the best-matching prize option</div>
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
                <div className={`rounded-[20px] bg-gradient-to-br ${visual?.theme ?? "from-slate-100 via-white to-slate-50"} p-4`}>
                  <div className="text-3xl">{option.emoji || visual?.emoji || "❖"}</div>
                  <div className="mt-3 text-base font-black text-slate-950">{option.label}</div>
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
          Final score {finalScore.toLocaleString("en-ZA")} · Rounds cleared {roundsCleared}
        </div>
      ) : null}
    </div>
  );
}
