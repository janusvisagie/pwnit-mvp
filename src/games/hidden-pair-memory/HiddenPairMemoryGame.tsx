
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { GameProps } from "../types";

const SYMBOL_BANK = ["trophy", "ticket", "bolt", "camera", "controller", "headphones"] as const;
const SYMBOL_META: Record<string, { emoji: string; label: string }> = {
  trophy: { emoji: "🏆", label: "Trophy" },
  ticket: { emoji: "🎟️", label: "Ticket" },
  bolt: { emoji: "⚡", label: "Bolt" },
  camera: { emoji: "📷", label: "Camera" },
  controller: { emoji: "🎮", label: "Controller" },
  headphones: { emoji: "🎧", label: "Headphones" },
};

const DEFAULT_PAIR_COUNT = 6;
const DEFAULT_MAX_TURNS = 10;
const MAX_SCORE = 25000;
const HIDE_DELAY_MS = 850;

type Challenge = {
  game?: "hidden-pair-memory";
  deck?: string[];
  boardSize?: number;
  pairCount?: number;
  maxTurns?: number;
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

function gridDistance(left: number, right: number, columns = 4) {
  const leftRow = Math.floor(left / columns);
  const leftCol = left % columns;
  const rightRow = Math.floor(right / columns);
  const rightCol = right % columns;
  return Math.abs(leftRow - rightRow) + Math.abs(leftCol - rightCol);
}

function buildDispersedDeck(symbols: readonly string[], columns = 4) {
  const boardSize = symbols.length * 2;
  const deck = Array.from({ length: boardSize }, () => "");
  const available = Array.from({ length: boardSize }, (_, index) => index);

  for (const symbol of shuffle(symbols)) {
    let placed = false;
    const firstCandidates = shuffle(available);

    for (const first of firstCandidates) {
      const partnerCandidates = shuffle(
        available.filter(
          (candidate) =>
            candidate !== first && gridDistance(first, candidate, columns) >= 3 && Math.abs(candidate - first) >= 3,
        ),
      );
      const partner = partnerCandidates[0];
      if (partner == null) continue;

      deck[first] = symbol;
      deck[partner] = symbol;
      available.splice(available.indexOf(first), 1);
      available.splice(available.indexOf(partner), 1);
      placed = true;
      break;
    }

    if (!placed) {
      const [first, partner] = shuffle(available).slice(0, 2);
      if (first == null || partner == null) break;
      deck[first] = symbol;
      deck[partner] = symbol;
      available.splice(available.indexOf(first), 1);
      available.splice(available.indexOf(partner), 1);
    }
  }

  return deck;
}

function buildChallenge(): Challenge {
  const pairCount = DEFAULT_PAIR_COUNT;
  return {
    game: "hidden-pair-memory",
    deck: buildDispersedDeck(SYMBOL_BANK.slice(0, pairCount)),
    pairCount,
    maxTurns: DEFAULT_MAX_TURNS,
  };
}

function getSymbolMeta(symbolId: string) {
  return SYMBOL_META[symbolId] ?? { emoji: "❔", label: symbolId };
}

export default function HiddenPairMemoryGame({ onFinish, disabled, challenge: injectedChallenge }: GameProps<Challenge>) {
  const [localChallenge, setLocalChallenge] = useState<Challenge>(() => buildChallenge());
  const verifiedMode = Boolean(injectedChallenge?.attemptId);
  const challenge = useMemo(() => (verifiedMode ? (injectedChallenge as Challenge) : localChallenge), [verifiedMode, injectedChallenge, localChallenge]);
  const boardSize = challenge.boardSize ?? challenge.deck?.length ?? DEFAULT_PAIR_COUNT * 2;
  const pairCount = challenge.pairCount ?? DEFAULT_PAIR_COUNT;
  const maxTurns = challenge.maxTurns ?? DEFAULT_MAX_TURNS;

  const [phase, setPhase] = useState<"READY" | "RUNNING" | "DONE">("READY");
  const [firstPick, setFirstPick] = useState<number | null>(null);
  const [temporaryReveal, setTemporaryReveal] = useState<Record<number, string>>({});
  const [matched, setMatched] = useState<Record<number, string>>({});
  const [turnCount, setTurnCount] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    setPhase("READY");
    setFirstPick(null);
    setTemporaryReveal({});
    setMatched({});
    setTurnCount(0);
    setMessage(null);
    setScore(null);
    setPending(false);
    startedAtRef.current = null;
  }, [challenge]);

  function start() {
    if (disabled) return;
    setPhase("RUNNING");
    setFirstPick(null);
    setTemporaryReveal({});
    setMatched({});
    setTurnCount(0);
    setScore(null);
    setPending(false);
    setMessage(
      verifiedMode
        ? "The board is hidden on the server. Flip two cards at a time and build your memory from the reveals."
        : "Flip two hidden cards at a time and clear all matching pairs before you run out of turns.",
    );
    startedAtRef.current = Date.now();
  }

  function finishCompleted(finalTurnCount: number) {
    const elapsedMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));
    const extraTurns = Math.max(0, finalTurnCount - pairCount);
    const finalScore = Math.max(1200, MAX_SCORE - elapsedMs - extraTurns * 1800);
    setPhase("DONE");
    setScore(finalScore);
    setMessage("All pairs matched.");
    onFinish({
      scoreMs: finalScore,
      meta: {
        game: "hidden-pair-memory",
        elapsedMs,
        turnCount: finalTurnCount,
        serverProgress: verifiedMode,
      },
    });
  }

  function finishFailed(finalTurnCount: number) {
    setPhase("DONE");
    setScore(0);
    setMessage("Out of turns.");
    onFinish({
      scoreMs: 0,
      meta: {
        game: "hidden-pair-memory",
        elapsedMs: Math.max(0, Date.now() - (startedAtRef.current ?? Date.now())),
        turnCount: finalTurnCount,
        serverProgress: verifiedMode,
      },
    });
  }

  async function resolveVerifiedPair(a: number, b: number) {
    if (!challenge.attemptId) return;
    setPending(true);
    try {
      const res = await fetch("/api/attempt/progress", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ attemptId: challenge.attemptId, picks: [a, b] }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setMessage(data?.error || `Could not reveal cards (${res.status})`);
        return;
      }

      const [symbolA, symbolB] = Array.isArray(data.reveal?.symbols) ? data.reveal.symbols.map(String) : ["", ""];
      const picks = Array.isArray(data.reveal?.picks) ? data.reveal.picks.map((value: unknown) => Number(value)) : [a, b];
      const localReveal: Record<number, string> = {
        [picks[0]]: symbolA,
        [picks[1]]: symbolB,
      };

      setTemporaryReveal(localReveal);
      setTurnCount(Number(data.turnCount || 0));
      setFirstPick(null);

      if (data.reveal?.match) {
        setMatched((current) => ({ ...current, ...localReveal }));
        setTemporaryReveal({});
        if (data.completed) {
          finishCompleted(Number(data.turnCount || 0));
        } else {
          setMessage("Match found.");
        }
        return;
      }

      setMessage("No match.");
      window.setTimeout(() => {
        setTemporaryReveal({});
        if (data.exhausted) {
          finishFailed(Number(data.turnCount || 0));
        }
      }, HIDE_DELAY_MS);
    } catch (e: any) {
      setMessage(e?.message || "Could not reveal cards.");
    } finally {
      setPending(false);
    }
  }

  function resolvePracticePair(a: number, b: number) {
    const deck = challenge.deck ?? [];
    const symbolA = String(deck[a] || "");
    const symbolB = String(deck[b] || "");
    const isMatch = symbolA && symbolA === symbolB;
    const localReveal: Record<number, string> = {
      [a]: symbolA,
      [b]: symbolB,
    };
    const nextTurnCount = turnCount + 1;

    setTemporaryReveal(localReveal);
    setTurnCount(nextTurnCount);
    setFirstPick(null);

    if (isMatch) {
      const nextMatched = { ...matched, ...localReveal };
      setMatched(nextMatched);
      setTemporaryReveal({});
      if (Object.keys(nextMatched).length === boardSize) {
        finishCompleted(nextTurnCount);
      } else {
        setMessage("Match found.");
      }
      return;
    }

    setMessage("No match.");
    window.setTimeout(() => {
      setTemporaryReveal({});
      if (nextTurnCount >= maxTurns) {
        finishFailed(nextTurnCount);
      }
    }, HIDE_DELAY_MS);
  }

  function chooseCard(index: number) {
    if (disabled || pending || phase !== "RUNNING") return;
    if (matched[index] || temporaryReveal[index]) return;

    if (firstPick == null) {
      setFirstPick(index);
      setMessage("Select one more card.");
      if (!verifiedMode && challenge.deck) {
        const symbol = String(challenge.deck[index] || "");
        setTemporaryReveal({ [index]: symbol });
      }
      return;
    }

    if (firstPick === index) return;

    const previousPick = firstPick;
    if (!verifiedMode && challenge.deck) {
      const revealState: Record<number, string> = {
        [previousPick]: String(challenge.deck[previousPick] || ""),
        [index]: String(challenge.deck[index] || ""),
      };
      setTemporaryReveal(revealState);
      resolvePracticePair(previousPick, index);
      return;
    }

    void resolveVerifiedPair(previousPick, index);
  }

  function renderCard(index: number) {
    const symbolId = matched[index] || temporaryReveal[index];
    const isOpen = Boolean(symbolId);
    const isSelected = firstPick === index && !isOpen;
    const meta = symbolId ? getSymbolMeta(symbolId) : null;

    return (
      <button
        key={index}
        type="button"
        onClick={() => chooseCard(index)}
        disabled={disabled || pending || phase !== "RUNNING" || Boolean(matched[index])}
        className={`flex aspect-square min-h-[72px] flex-col items-center justify-center rounded-2xl border text-center transition ${
          isOpen
            ? "border-slate-300 bg-white shadow-sm"
            : isSelected
              ? "border-slate-900 bg-white shadow-sm"
              : "border-slate-200 bg-slate-100 hover:-translate-y-0.5 hover:border-slate-300"
        } disabled:cursor-not-allowed`}
      >
        {isOpen && meta ? (
          <>
            <span className="text-2xl sm:text-3xl">{meta.emoji}</span>
            <span className="mt-1 text-[11px] font-bold text-slate-700 sm:text-xs">{meta.label}</span>
          </>
        ) : (
          <span className="text-xl font-black text-slate-400">?</span>
        )}
      </button>
    );
  }

  const matchedPairs = Object.keys(matched).length / 2;

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objective</div>
          <h3 className="mt-1 text-base font-black text-slate-950 sm:text-lg">Hidden Pair Memory</h3>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          Turns {turnCount} / {maxTurns}
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        Match all {pairCount} hidden pairs before you run out of turns. The real board is only revealed one pair at a time after you commit your picks.
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Replay starts a fresh round after this run ends. Match all pairs by remembering where previously revealed symbols sit. Wrong pairs flash briefly and then hide again.
      </p>

      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-4">
        {Array.from({ length: boardSize }, (_, index) => renderCard(index))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
          Pairs found {matchedPairs} / {pairCount}
        </div>
        <button
          type="button"
          onClick={() => {
            if (!verifiedMode && phase !== "READY") {
              setLocalChallenge(buildChallenge());
            }
            start();
          }}
          disabled={disabled || pending || phase === "RUNNING"}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          {phase === "READY" ? "Start Hidden Pair Memory" : "Replay"}
        </button>
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
