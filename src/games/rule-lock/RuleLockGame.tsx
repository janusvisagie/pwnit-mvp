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
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const startedAtRef = useRef<number | null>(null);

  const availableIds = puzzle.symbols.map((symbol) => symbol.id).filter((id) => !slots.includes(id));

  function start() {
    if (disabled) return;
    setPhase("RUNNING");
    setSlots(Array.from({ length: 5 }, () => ""));
    setSelectedId(null);
    setChecksUsed(0);
    setScore(null);
    setMessage("Place all five seals, then press Check lock. Each press uses one of your three checks.");
    startedAtRef.current = Date.now();
  }

  function placeSymbol(id: string, index: number) {
    setSlots((current) => {
      const next = [...current];
      const existingIndex = next.indexOf(id);
      if (existingIndex >= 0) next[existingIndex] = "";
      next[index] = id;
      return next;
    });
    setSelectedId(id);
  }

  function clearSlot(index: number) {
    if (disabled || phase !== "RUNNING") return;
    setSlots((current) => {
      const next = [...current];
      next[index] = "";
      return next;
    });
  }

  function handleDrop(index: number, droppedId: string | null) {
    if (disabled || phase !== "RUNNING" || !droppedId) return;
    placeSymbol(droppedId, index);
    setDraggingId(null);
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

    setMessage(`Not quite. ${MAX_CHECKS - nextChecks} checks remaining.`);
  }

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objective</div>
          <h3 className="mt-1 text-base font-black text-slate-950 sm:text-lg">Rule Lock</h3>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          Checks remaining {Math.max(0, MAX_CHECKS - checksUsed)}
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-600">Arrange the five seals so every rule is true at the same time.</p>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <div className="font-semibold text-slate-900">Checks left</div>
        <div className="mt-1">Each time you press <span className="font-bold">Check lock</span>, one check is used. You have {MAX_CHECKS} checks total.</div>
      </div>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rules</div>
        <div className="mt-2 space-y-2 text-sm text-slate-700">
          {puzzle.rules.map((rule, index) => (
            <div key={rule.id} className="rounded-xl bg-white px-3 py-2">
              <span className="font-black text-slate-900">{index + 1}.</span> {rule.text}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="grid gap-2">
          {slots.map((slot, index) => {
            const current = puzzle.symbols.find((symbol) => symbol.id === slot);
            return (
              <button
                key={index}
                type="button"
                onClick={() => {
                  if (slot) clearSlot(index);
                  else if (selectedId) placeSymbol(selectedId, index);
                }}
                onDragOver={(event) => {
                  if (phase === "RUNNING") event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const droppedId = event.dataTransfer.getData("text/plain") || draggingId;
                  handleDrop(index, droppedId || null);
                }}
                disabled={disabled || phase !== "RUNNING"}
                className="min-h-[58px] rounded-2xl border border-slate-300 bg-white px-3 py-2 text-left text-sm font-black text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                <div className="text-[11px] uppercase tracking-wide text-slate-400">Slot {index + 1}</div>
                <div className="mt-1">{current?.label ?? "Drop or click here"}</div>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:w-[13rem]">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Seal bank</div>
          <div className="mt-2 grid gap-2">
            {puzzle.symbols.map((symbol) => {
              const placed = slots.includes(symbol.id);
              const selected = selectedId === symbol.id;
              return (
                <button
                  key={symbol.id}
                  type="button"
                  draggable={!placed && phase === "RUNNING"}
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", symbol.id);
                    setDraggingId(symbol.id);
                  }}
                  onDragEnd={() => setDraggingId(null)}
                  onClick={() => setSelectedId(symbol.id)}
                  disabled={disabled || phase !== "RUNNING" || placed}
                  className={[
                    "rounded-2xl border px-3 py-2 text-sm font-black transition",
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
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={checkLock}
          disabled={disabled || phase !== "RUNNING" || slots.some((slot) => !slot)}
          className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Check lock
        </button>
        <button
          type="button"
          onClick={start}
          disabled={disabled}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          {phase === "READY" ? "Start Rule Lock" : "Restart"}
        </button>
        <div className="self-center text-sm text-slate-500">
          {selectedId ? `Selected: ${puzzle.symbols.find((symbol) => symbol.id === selectedId)?.label}` : `${availableIds.length} seals left to place`}
        </div>
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
