// src/components/ItemCard.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CountdownChip } from "@/components/CountdownChip";

export type ItemCardModel = {
  id: string;
  title: string;
  prizeValueZAR: number;
  state: string;
  activationGoalEntries: number;
  totalEntriesToday: number;
  imageUrl: string | null;

  closesAt?: string | null;
  playCostCredits?: number;

  // Optional: pass if you want it displayed on tile
  gameKey?: string | null;
};

function formatZAR(v: number) {
  return `R${Number(v || 0).toLocaleString("en-ZA")}`;
}

function progressPct(total: number, goal: number) {
  if (!goal || goal <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((total / goal) * 100)));
}

function minutesLeft(closesAtIso?: string | null) {
  if (!closesAtIso) return null;
  const t = Date.parse(closesAtIso);
  if (!Number.isFinite(t)) return null;
  const ms = t - Date.now();
  return Math.max(0, Math.floor(ms / 60_000));
}

function gameLabel(k?: string | null) {
  if (!k) return null;
  if (k === "precision-timer") return "Precision Timer";
  if (k === "rhythm-hold") return "Rhythm Hold";
  if (k === "tap-speed") return "Tap Speed";
  if (k === "number-memory") return "Number Memory";
  if (k === "target-hold") return "Target Hold";
  if (k === "stop-zero") return "Stop Zero";
  if (k === "tap-pattern") return "Tap Pattern";
  return k;
}

export function ItemCard({ item }: { item: ItemCardModel }) {
  const [imgOk, setImgOk] = useState(true);

  const pct = progressPct(item.totalEntriesToday, item.activationGoalEntries);
  const remaining = Math.max(0, (item.activationGoalEntries || 0) - (item.totalEntriesToday || 0));

  const showEndsIn = item.state === "ACTIVATED" && !!item.closesAt;

  const closed = item.state === "CLOSED" || item.state === "PUBLISHED";
  const deepLink = item.state === "PUBLISHED" ? `/item/${item.id}/leaderboard` : `/item/${item.id}`;

  const hot = useMemo(() => {
    if (closed) return false;
    if (item.state === "ACTIVATED") return true;
    if (item.state === "OPEN" && pct >= 75) return true;
    if (item.state === "OPEN" && remaining <= 2) return true;

    const mins = minutesLeft(item.closesAt);
    if (item.state === "ACTIVATED" && mins != null && mins <= 3) return true;

    return false;
  }, [item.state, pct, remaining, item.closesAt, closed]);

  const urgencyText = useMemo(() => {
    if (closed) return "Results available";
    if (item.state === "ACTIVATED") return "Live now";
    if (item.state === "OPEN" && remaining > 0 && remaining <= 2) return `Only ${remaining} more to go`;
    if (item.state === "OPEN" && pct >= 75) return "Almost live";
    return null;
  }, [item.state, remaining, pct, closed]);

  const showCost = typeof item.playCostCredits === "number";
  const gLabel = gameLabel(item.gameKey);

  return (
    <Link
      href={deepLink}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md"
    >
      {/* HERO */}
      <div className="relative flex h-[160px] items-center justify-center overflow-hidden bg-slate-50 p-3">
        {item.imageUrl && imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.title}
            className="max-h-full max-w-full object-contain transition group-hover:scale-[1.02]"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="text-xs text-slate-500">Image missing</div>
        )}

        {/* Top-right: price */}
        <div className="absolute right-3 top-3 rounded-xl bg-slate-900 px-2.5 py-1 text-xs font-extrabold text-white shadow">
          {formatZAR(item.prizeValueZAR)}
        </div>

        {/* Hot badge */}
        {hot ? (
          <div className="absolute right-3 bottom-3 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-extrabold text-slate-900 shadow">
            🔥 Hot
          </div>
        ) : null}

        {/* Ends-in strip (only when live) */}
        {showEndsIn ? (
          <div className="absolute left-3 bottom-3">
            <div className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 shadow ring-1 ring-slate-200/70 backdrop-blur">
              <CountdownChip state={item.state} closesAt={item.closesAt ?? null} />
            </div>
          </div>
        ) : null}

        {/* Diagonal banner for closed/published */}
        {closed ? (
          <div className="pointer-events-none absolute left-0 top-0 w-full">
            <div className="w-full bg-slate-900/90 px-3 py-2 text-center text-xs font-extrabold text-white shadow">
              Item already won • New item loading
            </div>
          </div>
        ) : null}
      </div>

      {/* BODY */}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-extrabold text-slate-900">{item.title}</div>

            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
              {urgencyText ? <span className="font-semibold">{urgencyText}</span> : null}
              {gLabel ? (
                <span className="rounded-full bg-slate-50 px-2 py-0.5 font-semibold text-slate-700 ring-1 ring-slate-200">
                  {gLabel}
                </span>
              ) : null}
            </div>
          </div>

          {/* mini % pill (keep only ONE % on tile) */}
          <div className="shrink-0 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-extrabold text-slate-900 ring-1 ring-slate-200">
            {pct}%
          </div>
        </div>

        {/* Compact activation line: progress + cost on same row */}
        <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-600">
          <span>
            {item.totalEntriesToday}/{item.activationGoalEntries} entries
            {item.state === "OPEN" && remaining > 0 ? <span className="ml-2 text-slate-500">({remaining} to go)</span> : null}
          </span>

          {showCost ? (
            <span className="font-semibold text-slate-900">
              {item.playCostCredits} {item.playCostCredits === 1 ? "credit" : "credits"}/play
            </span>
          ) : null}
        </div>

        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full bg-slate-900" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </Link>
  );
}
