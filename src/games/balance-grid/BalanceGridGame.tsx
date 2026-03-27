"use client";

import { useMemo, useRef, useState } from "react";

import type { GameProps } from "../types";

const GRID_SIZE = 3;
const MAX_SCORE = 22000;

type Challenge = {
  game?: "balance-grid";
  board: number[];
  targetSum: number;
  solution: number[];
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
  return cells.reduce((sum, cell) => sum + board[cell]!, 0);
}

function buildChallenge(): Challenge {
  for (let tries = 0; tries < 60; tries += 1) {
    const board = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const candidates = COLUMN_PERMUTATIONS.map((perm) => ({ cells: perm.map((col, row) => row * GRID_SIZE + col) })).map((entry) => ({
      ...entry,
      total: sumForSelection(board, entry.cells),
    }));

    const unique = candidates.filter((candidate) => candidates.filter((other) => other.total === candidate.total).length === 1);
    if (!unique.length) continue;

    const picked = unique[Math.floor(Math.random() * unique.length)]!;
    return {
      board,
      targetSum: picked.total,
      solution: picked.cells,
    };
  }

  return {
    board: [8, 1, 6, 3, 5, 7, 4, 9, 2],
    targetSum: 15,
    solution: [0, 4, 8],
  };
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

function sameSelection(a: number[], b: number[]) {
  const left = [...a].sort((x, y) => x - y);
  const right = [...b].sort((x, y) => x - y);
  return left.length === right.length && left.every((value, index) => value === right[index]);
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
    const exactSolution = sameSelection(selected, challenge.solution);
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
        exactSolution,
        elapsedMs,
      },
    });
  }

  const currentTotal = sumForSelection(challenge.board, selected);
  const rowsCovered = new Set(selected.map(rowOf)).size;
  const colsCovered = new Set(selected.map(colOf)).size;

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objective</div>
          <h3 className="mt-1 text-base font-black text-slate-950 sm:text-lg">Balance Grid</h3>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">Pick {selected.length} / {GRID_SIZE}</div>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        Choose exactly three numbers: one from each row and one from each column. Your three picks must add up to the target.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <div className="font-semibold text-slate-900">Target total</div>
          <div className="mt-1 text-2xl font-black text-slate-950">{challenge.targetSum}</div>
          <div className="mt-2 text-xs text-slate-500">Current total: {currentTotal}</div>
          <div className="mt-1 text-xs text-slate-500">Rows covered: {rowsCovered}/3 • Columns covered: {colsCovered}/3</div>
        </div>

        <div className="mx-auto grid w-full max-w-[17rem] grid-cols-3 gap-2">
          {challenge.board.map((value, cell) => {
            const active = selected.includes(cell);
            return (
              <button
                key={cell}
                type="button"
                onClick={() => toggleCell(cell)}
                disabled={disabled || phase !== "RUNNING"}
                className={[
                  "aspect-square rounded-xl border text-lg font-black transition sm:text-xl",
                  active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900",
                  phase === "RUNNING" ? "hover:-translate-y-0.5 hover:border-slate-400" : "cursor-default",
                ].join(" ")}
              >
                {value}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={start}
          disabled={disabled}
          className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {phase === "READY" ? "Start Balance Grid" : "Restart"}
        </button>
        <button
          type="button"
          onClick={clear}
          disabled={disabled || phase !== "RUNNING" || selected.length === 0}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={disabled || phase !== "RUNNING" || selected.length !== GRID_SIZE}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          Submit
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
