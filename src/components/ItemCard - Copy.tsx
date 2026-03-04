"use client";

import Link from "next/link";
import { useState } from "react";

export type ItemCardModel = {
  id: string;
  title: string;
  prizeValueZAR: number;
  state: string;
  activationGoalEntries: number;
  totalEntriesToday: number;
  imageUrl: string | null;
};

function formatZAR(v: number) {
  return `R${Number(v || 0).toLocaleString("en-ZA")}`;
}

function progressPct(total: number, goal: number) {
  if (!goal || goal <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((total / goal) * 100)));
}

function stateLabel(s: string) {
  if (s === "OPEN") return "Open";
  if (s === "ACTIVATED") return "Live";
  if (s === "CLOSED") return "Closed";
  if (s === "PUBLISHED") return "Results";
  return s || "Open";
}

export function ItemCard({ item }: { item: ItemCardModel }) {
  const pct = progressPct(item.totalEntriesToday, item.activationGoalEntries);
  const [imgOk, setImgOk] = useState(true);

  return (
    <Link
      href={`/item/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md"
    >
      {/* HERO */}
      <div className="relative h-[150px] sm:h-[170px] bg-slate-50 flex items-center justify-center p-3 overflow-hidden">

        {item.imageUrl && imgOk ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="max-h-full max-w-full object-contain transition group-hover:scale-[1.02]"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="text-xs text-slate-500">Image missing</div>
        )}

        {/* state chip */}
        <div className="absolute left-3 top-3 rounded-full bg-white px-2 py-1 text-xs font-semibold shadow">
          {stateLabel(item.state)}
        </div>

        {/* price */}
        <div className="absolute right-3 top-3 rounded-lg bg-slate-900 px-2 py-1 text-xs font-bold text-white">
          {formatZAR(item.prizeValueZAR)}
        </div>
      </div>

      {/* BODY */}
      <div className="px-4 py-2">
        <div className="truncate text-sm font-semibold text-slate-900">
          {item.title}
        </div>

        <div className="mt-1 flex justify-between text-xs text-slate-600">
          <span>
            {item.totalEntriesToday}/{item.activationGoalEntries} entries
          </span>
          <span className="font-semibold text-slate-900">{pct}%</span>
        </div>

        <div className="mt-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
          <div className="h-full bg-slate-900" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </Link>
  );
}
