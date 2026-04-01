"use client";

import { useMemo, useRef, useState } from "react";

import type { GameProps } from "../types";

const GRID_SIZE = 3;
const MAX_SCORE = 22000;

type Challenge = {
  game?: "balance-grid";
  board: number[];
  targetSum: number;
  solution?: number[];
};

function shuffle<T>(values: readonly T[]) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function buildPermutations(values: number[]): number[][] {
  if (values.length <= 1) return [values];
  const output: number[][] = [];
  for (let i = 0; i < values.length; i += 1) {
    const current = values[i]!;
    const rest = [...values.slice(0, i), ...values.slice(i + 1)];
    for (const tail of buildPermutations(rest)) {
      output.push([current, ...tail]);
    }
  }
  return output;
}

const COLUMN_PERMUTATIONS = buildPermutations([0, 1, 2]);

function sumForSelection(board: number[], cells: number[]) {
  return cells.reduce((sum, cell) => sum + (board[cell] ?? 0), 0);
}

function rowOf(cell: number) {
  return Math.floor(cell / GRID_SIZE);
}

function colOf(cell: number) {
  return cell % GRID_SIZE;
}

function hasUniqueRowsAndCols(cells: number[]) {
  const rows = new Set(cells.map(rowOf));
  const cols = new Set(cells.map(colOf));
  return rows.size === cells.length && cols.size === cells.length;
}

function sameSelection(a: number[], b?: number[]) {
  if (!b || a.length !== b.length) return false;
  const left = [...a].sort((x, y) => x - y);
  const right = [...b].sort((x, y) => x - y);
  return left.every((value, index) => value === right[index]);
}

function buildChallenge(): Challenge {
  for (let tries = 0; tries < 60; tries += 1) {
    const board = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const candidates = COLUMN_PERMUTATIONS.map((perm) => ({ cells: perm.map((col, row) => row * GRID_SIZE + col) }))
      .map((entry) => ({ ...entry, total: sumForSelection(board, entry.cells) }));
    const unique = candidates.filter((candidate) => candidates.filter((other) => other.total === candidate.total).length === 1);
    if (!unique.length) continue;
    const picked = unique[Math.floor(Math.random() * unique.length)]!;
    return {
      game: "balance-grid",
      board,
      targetSum: picked.total,
      solution: picked.cells,
    };
  }

  return {
    game: "balance-grid",
    board: [8, 1, 6, 3, 5, 7, 4, 9, 2],
    targetSum: 15,
    solution: [0, 4, 8],
  };
}

export default function BalanceGridGame({ onFinish, disabled, challenge: injectedChallenge }: GameProps<Challenge>) {
  const challenge = useMemo(() => injectedChallenge ?? buildChallenge(), [injectedChallenge]);
  const [phase, setPhase] = useState<"READY" | "RUNNING" | "DONE">("READY");
  const [selected, setSelected] = useState<number[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const startedAtRef = useRef<number | null>(null);

  function start() {
    if (disabled) return;
    setPhase("RUNNING");
    setSelected([]);
    setScore(null);
    setMessage("Pick one number from each row and each column so the total matches the target.");
    startedAtRef.current = Date.now();
  }

  function toggleCell(cell: number) {
    if (disabled || phase !== "RUNNING") return;
    setSelected((current) => {
      if (current.includes(cell)) return current.filter((value) => value !== cell);
      if (current.length >= GRID_SIZE) return current;
      return [...current, cell];
    });
  }

  function clear() {
    if (disabled || phase !== "RUNNING") return;
    setSelected([]);
    setMessage("Selection cleared.");
  }

  function submit() {
    if (disabled || phase !== "RUNNING" || selected.length !== GRID_SIZE) return;

    const elapsedMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));
    const uniquePlacement = hasUniqueRowsAndCols(selected);
    const total = sumForSelection(challenge.board, selected);
    const correct = uniquePlacement && total === challenge.targetSum;
    const exactSolution = challenge.solution ? sameSelection(selected, challenge.solution) : undefined;
    const finalScore = correct ? Math.max(1200, MAX_SCORE - elapsedMs) : 0;

    setPhase("DONE");
    setScore(finalScore);
    setMessage(
      correct
        ? "Balanced. You matched the target with a valid row-and-column set."
        : uniquePlacement
          ? `Not quite. Your total was ${total}, target was ${challenge.targetSum}.`
          : "Invalid shape. You need one pick per row and one per column.",
    );

    onFinish({
      scoreMs: finalScore,
      meta: {
        game: "balance-grid",
        board: challenge.board,
        targetSum: challenge.targetSum,
        selected,
        correct,
        ...(typeof exactSolution === "boolean" ? { exactSolution } : {}),
        elapsedMs,
      },
    });
  }

  const currentTotal = sumForSelection(challenge.board, selected);

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objective</div>
          <h3 className="mt-1 text-base font-black text-slate-950 sm:text-lg">Balance Grid</h3>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">Target {challenge.targetSum}</div>
      </div>

      <p className="mt-2 text-sm text-slate-600">Choose exactly three cells so you cover one row and one column each and hit the target sum.</p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {challenge.board.map((value, index) => {
          const active = selected.includes(index);
          return (
            <button
              key={index}
              type="button"
              onClick={() => toggleCell(index)}
              disabled={disabled || phase !== "RUNNING"}
              className={`aspect-square rounded-2xl border text-lg font-black transition ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-900"}`}
            >
              {value}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {phase === "READY" ? (
          <button type="button" onClick={start} disabled={disabled} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
            Start
          </button>
        ) : phase === "RUNNING" ? (
          <>
            <button type="button" onClick={submit} disabled={disabled || selected.length !== GRID_SIZE} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
              Submit
            </button>
            <button type="button" onClick={clear} disabled={disabled} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-50">
              Clear
            </button>
            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">Current total: {currentTotal}</span>
          </>
        ) : (
          <button type="button" onClick={start} disabled={disabled} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
            Replay
          </button>
        )}
      </div>

      {message ? <p className="mt-3 text-sm text-slate-700">{message}</p> : null}
      {typeof score === "number" ? <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Local score: {score}</p> : null}
    </div>
  );
}
