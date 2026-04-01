"use client";

import { useMemo, useRef, useState } from "react";
import type { GameProps } from "../types";

type Challenge = {
  game: "balance-grid";
  board: number[];
  targetSum: number;
};

const MAX_SCORE = 12000;

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function buildChallenge(): Challenge {
  const boards = [
    [8, 1, 6, 3, 5, 7, 4, 9, 2],
    [2, 7, 6, 9, 5, 1, 4, 3, 8],
    [6, 7, 2, 1, 5, 9, 8, 3, 4],
  ];
  return {
    game: "balance-grid",
    board: boards[randomInt(boards.length)]!,
    targetSum: 15,
  };
}

function rowOf(cell: number) {
  return Math.floor(cell / 3);
}

function colOf(cell: number) {
  return cell % 3;
}

function hasUniqueRowsAndCols(cells: number[]) {
  const rows = new Set(cells.map(rowOf));
  const cols = new Set(cells.map(colOf));
  return rows.size === cells.length && cols.size === cells.length;
}

function sumForSelection(board: number[], cells: number[]) {
  return cells.reduce((sum, cell) => sum + board[cell]!, 0);
}

export default function BalanceGridGame({ onFinish, disabled, challenge: injectedChallenge }: GameProps<Challenge>) {
  const challenge = useMemo(() => injectedChallenge ?? buildChallenge(), [injectedChallenge]);
  const [selected, setSelected] = useState<number[]>([]);
  const [phase, setPhase] = useState<"READY" | "RUNNING" | "DONE">("READY");
  const [message, setMessage] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const startedAtRef = useRef<number | null>(null);

  function reset() {
    setSelected([]);
    setPhase("RUNNING");
    setMessage("Pick exactly one number from each row and each column to hit the target.");
    setScore(null);
    startedAtRef.current = Date.now();
  }

  function complete(finalSelection: number[]) {
    const elapsedMs = Math.max(0, Date.now() - (startedAtRef.current ?? Date.now()));
    const uniquePlacement = hasUniqueRowsAndCols(finalSelection);
    const total = sumForSelection(challenge.board, finalSelection);
    const correct = uniquePlacement && total === challenge.targetSum;
    const finalScore = correct ? Math.max(1200, MAX_SCORE - elapsedMs) : 0;

    setPhase("DONE");
    setScore(finalScore);
    setMessage(
      correct
        ? "Balanced. You matched the target with a valid row-and-column set."
        : uniquePlacement
          ? `Not quite. Your total was ${total}, target was ${challenge.targetSum}.`
          : "Invalid shape. You need one pick per row and one pick per column.",
    );

    onFinish({
      scoreMs: finalScore,
      meta: {
        game: "balance-grid",
        selected: finalSelection,
      },
    });
  }

  function toggleCell(cell: number) {
    if (disabled || phase !== "RUNNING") return;

    setSelected((current) => {
      const exists = current.includes(cell);
      let next = exists ? current.filter((value) => value !== cell) : [...current, cell];
      if (!exists && next.length > 3) {
        next = [...next.slice(1)];
      }
      if (next.length === 3) {
        queueMicrotask(() => complete(next));
      }
      return next;
    });
  }

  const currentTotal = sumForSelection(challenge.board, selected);
  const rowsCovered = new Set(selected.map(rowOf)).size;
  const colsCovered = new Set(selected.map(colOf)).size;

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Balance Grid</div>
          <div className="text-lg font-black text-slate-900">Find the matching trio</div>
        </div>
        <button
          type="button"
          onClick={reset}
          disabled={disabled}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {phase === "READY" ? "Start" : "Replay"}
        </button>
      </div>

      <p className="mt-2 text-sm text-slate-600">Pick exactly three numbers so the total equals <span className="font-bold text-slate-900">{challenge.targetSum}</span>, using one cell from each row and one from each column.</p>

      <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
        <div>Current total: {currentTotal}</div>
        <div>Rows covered: {rowsCovered} / 3</div>
        <div>Cols covered: {colsCovered} / 3</div>
        {score !== null ? <div>Score: {score}</div> : null}
      </div>

      <div className="mx-auto mt-4 grid max-w-[15rem] grid-cols-3 gap-2">
        {challenge.board.map((value, cell) => {
          const active = selected.includes(cell);
          return (
            <button
              key={cell}
              type="button"
              onClick={() => toggleCell(cell)}
              disabled={disabled || phase !== "RUNNING"}
              className={[
                "aspect-square rounded-3xl border text-xl font-black transition",
                active
                  ? "border-emerald-500 bg-emerald-100 text-emerald-900"
                  : "border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300 hover:bg-slate-100",
              ].join(" ")}
            >
              {value}
            </button>
          );
        })}
      </div>

      {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
