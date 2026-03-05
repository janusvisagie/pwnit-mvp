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
  const remaining = Math.max(
    0,
    (item.activationGoalEntries || 0) - (item.totalEntriesToday || 0)
  );

  const showEndsIn = item.state === "ACTIVATED" && !!item.closesAt;
  const closed = item.state === "CLOSED" || item.state === "PUBLISHED";
  const deepLink =
    item.state === "PUBLISHED" ? `/item/${item.id}/leaderboard` : `/item/${item.id}`;

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
      className="group relative block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
    >
      {/* HERO */}
      <div className="relative aspect-[16/9] w-full bg-slate-50">
        {item.imageUrl && imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-contain p-4"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-500">
            Image missing
          </div>
        )}

        {/* Top-right: price */}
        <div className="absolute right-3 top-3 rounded-full bg-slate-900 px-3 py-1 text-xs font-extrabold text-white">
          {formatZAR(item.prizeValueZAR)}
        </div>

        {/* Hot badge */}
        {hot ? (
          <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-slate-900">
            Hot
          </div>
        ) : null}

        {/* Ends-in strip (only when live) */}
        {showEndsIn ? (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-slate-700">
            <span>Ends in</span>
            <CountdownChip state={item.state} closesAtIso={item.closesAt ?? null} labelWhenClosed="Closed" />
          </div>
        ) : null}

        {/* Diagonal banner for closed/published (FULL COVER) */}
        {closed ? (
          <div className="pointer-events-none absolute left-[-30%] top-[40%] w-[160%] -rotate-12 bg-slate-900/90 py-2 text-center text-xs font-extrabold tracking-wide text-white shadow-lg">
            Item already won • New item loading
          </div>
        ) : null}
      </div>

      {/* BODY */}
      <div className="p-4">
        <div className="text-base font-extrabold text-slate-900 group-hover:underline">
          {item.title}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          {urgencyText ? (
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700">
              {urgencyText}
            </span>
          ) : null}
          {gLabel ? (
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700">
              {gLabel}
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-extrabold text-white">
            {pct}%
          </span>
          <div className="text-xs font-semibold text-slate-700">
            {item.totalEntriesToday}/{item.activationGoalEntries} entries{" "}
            {item.state === "OPEN" && remaining > 0 ? (
              <span className="text-slate-500">({remaining} to go)</span>
            ) : null}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-end">
          {showCost ? (
            <span className="text-xs font-semibold text-slate-700">
              {item.playCostCredits}{" "}
              {item.playCostCredits === 1 ? "credit" : "credits"}/play
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export default ItemCard;
