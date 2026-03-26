"use client";

import { useMemo, useRef, useState } from "react";

import type { GameProps } from "../types";

type SymbolDef = {
  id: string;
  label: string;
};

type RuleDef = {
  id: string;
  text: string;
  check: (slots: string[]) => boolean;
};

type Puzzle = {
  symbols: SymbolDef[];
  rules: RuleDef[];
};

type Challenge = {
  game?: "rule-lock";
  symbols: SymbolDef[];
  constraints: {
    leftId: string;
    rightId: string;
    fixedId: string;
    fixedSlot: number;
    pairA: string;
    pairB: string;
    notEdgeId: string;
  };
  rules: Array<{ id: string; text: string }>;
};

const SYMBOLS: SymbolDef[] = [
  { id: "sun", label: "Sun" },
  { id: "moon", label: "Moon" },
  { id: "star", label: "Star" },
  { id: "wave", label: "Wave" },
  { id: "leaf", label: "Leaf" },
];
const MAX_SCORE = 23000;
const MAX_CHECKS = 3;

function shuffle<T>(values: readonly T[]) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function buildChallenge(): Challenge {
  const arranged = shuffle(SYMBOLS);
  const ids = arranged.map((symbol) => symbol.id);
  const labels = new Map(arranged.map((symbol) => [symbol.id, symbol.label]));
  const slotOf = (id: string) => ids.indexOf(id);

  const leftId = ids[0]!;
  const rightId = ids[2]!;
  const fixedId = ids[4]!;
  const pairA = ids[1]!;
  const pairB = ids[2]!;
  const notEdgeId = ids[3]!;

  return {
    symbols: arranged,
    constraints: {
      leftId,
      rightId,
      fixedId,
      fixedSlot: slotOf(fixedId),
      pairA,
      pairB,
      notEdgeId,
    },
    rules: [
      { id: "left-right", text: `${labels.get(leftId)} must be left of ${labels.get(rightId)}.` },
      { id: "fixed-slot", text: `${labels.get(fixedId)} must be in slot ${slotOf(fixedId) + 1}.` },
      { id: "adjacent-pair", text: `${labels.get(pairA)} must sit directly next to ${labels.get(pairB)}.` },
      { id: "not-edge", text: `${labels.get(notEdgeId)} cannot be on either edge.` },
    ],
  };
}

function toPuzzle(challenge: Challenge): Puzzle {
  const { constraints } = challenge;
  return {
    symbols: challenge.symbols,
    rules: challenge.rules.map((rule) => ({
      id: rule.id,
      text: rule.text,
      check: (slots: string[]) => {
        switch (rule.id) {
          case "left-right":
            return slots.indexOf(constraints.leftId) < slots.indexOf(constraints.rightId);
          case "fixed-slot":
            return slots[constraints.fixedSlot] === constraints.fixedId;
          case "adjacent-pair":
            return Math.abs(slots.indexOf(constraints.pairA) - slots.indexOf(constraints.pairB)) === 1;
          case "not-edge": {
            const idx = slots.indexOf(constraints.notEdgeId);
            return idx > 0 && idx < slots.length - 1;
          }
          default:
            return false;
        }
      },
    })),
  };
}

export default function RuleLockGame({ onFinish, disabled, challenge: injectedChallenge }: GameProps<Challenge>) {
  const challenge = useMemo(() => injectedChallenge ?? buildChallenge(), [injectedChallenge]);
  const puzzle = useMemo(() => toPuzzle(challenge), [challenge]);
  const [phase, setPhase] = useState<"READY" | "RUNNING" | "DONE">("READY");
  const [slots, setSlots] = useState<string[]>(Array.from({ length: 5 }, () => ""));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checksUsed, setChecksUsed] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const startedAtRef = useRef<number | null>(null);

  const availableIds = puzzle.symbols.map((symbol) => symbol.id).filter((id) => !slots.includes(id));

  function start() {
    if (disabled) return;
    setPhase("RUNNING");
    setSlots(Array.from({ length: 5 }, () => ""));
    setSelectedId(null);
    setChecksUsed(0);
    setScore(null);
    setMessage("Place all five seals, then check the lock.");
    startedAtRef.current = Date.now();
  }

  function placeInSlot(index: number) {
    if (disabled || phase !== "RUNNING" || !selectedId) return;

    setSlots((current) => {
      const next = [...current];
      const existingIndex = next.indexOf(selectedId);
      if (existingIndex >= 0) next[existingIndex] = "";
      next[index] = selectedId;
      return next;
    });
  }

  function clearSlot(index: number) {
    if (disabled || phase !== "RUNNING") return;
    setSlots((current) => {
      const next = [...current];
      next[index] = "";
      return next;
    });
  }

  function checkLock() {
    if (disabled || phase !== "RUNNING") return;
    if (slots.some((slot) => !slot)) {
      setMessage("Fill every slot first.");
      return;
    }

    const nextChecks = checksUsed + 1;
    setChecksUsed(nextChecks);
    const passed = puzzle.rules.every((rule) => rule.check(slots));

    if (passed) {
      const elapsedMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));
      const finalScore = Math.max(1200, MAX_SCORE - elapsedMs - (nextChecks - 1) * 2200);
      setPhase("DONE");
      setScore(finalScore);
      setMessage("Lock opened.");
      onFinish({
        scoreMs: finalScore,
        meta: {
          game: "rule-lock",
          solved: true,
          elapsedMs,
          checksUsed: nextChecks,
          placements: slots,
          ruleIds: puzzle.rules.map((rule) => rule.id),
        },
      });
      return;
    }

    if (nextChecks >= MAX_CHECKS) {
      setPhase("DONE");
      setScore(0);
      setMessage("Lock failed.");
      onFinish({
        scoreMs: 0,
        meta: {
          game: "rule-lock",
          solved: false,
          checksUsed: nextChecks,
          placements: slots,
          ruleIds: puzzle.rules.map((rule) => rule.id),
        },
      });
      return;
    }

    setMessage(`Not quite. ${MAX_CHECKS - nextChecks} checks left.`);
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Objective</div>
          <h3 className="mt-1 text-lg font-black text-slate-950">Rule Lock</h3>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          Checks left {Math.max(0, MAX_CHECKS - checksUsed)}
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-600">Arrange the five seals so every rule is true at the same time.</p>

      <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        {puzzle.rules.map((rule, index) => (
          <div key={rule.id} className="flex gap-2">
            <span className="font-black text-slate-900">{index + 1}.</span>
            <span>{rule.text}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2">
        {slots.map((slot, index) => {
          const current = puzzle.symbols.find((symbol) => symbol.id === slot);
          return (
            <button
              key={`slot-${index}`}
              type="button"
              onClick={() => (slot ? clearSlot(index) : placeInSlot(index))}
              disabled={disabled || phase !== "RUNNING"}
              className="min-h-[72px] rounded-2xl border border-slate-300 bg-white px-2 py-3 text-sm font-black text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Slot {index + 1}</div>
              <div className="mt-2">{current?.label ?? "Empty"}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {puzzle.symbols.map((symbol) => {
          const placed = slots.includes(symbol.id);
          const selected = selectedId === symbol.id;
          return (
            <button
              key={symbol.id}
              type="button"
              onClick={() => setSelectedId(symbol.id)}
              disabled={disabled || phase !== "RUNNING" || placed}
              className={[
                "rounded-2xl border px-3 py-3 text-sm font-black transition",
                placed
                  ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                  : selected
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-900 hover:-translate-y-0.5 hover:border-slate-300",
              ].join(" ")}
            >
              {symbol.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={checkLock}
          disabled={disabled || phase !== "RUNNING" || slots.some((slot) => !slot)}
          className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Check lock
        </button>
        <button
          type="button"
          onClick={start}
          disabled={disabled}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          {phase === "READY" ? "Start rule lock" : "Restart"}
        </button>
        <div className="self-center text-sm text-slate-500">
          {selectedId ? `Selected: ${puzzle.symbols.find((symbol) => symbol.id === selectedId)?.label}` : `${availableIds.length} seals left to place`}
        </div>
      </div>

      {message ? (
        <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">{message}</div>
      ) : null}

      {score != null ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
          Score {score.toLocaleString("en-ZA")}
        </div>
      ) : null}
    </div>
  );
}
