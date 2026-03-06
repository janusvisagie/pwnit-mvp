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
  const remaining = Math.max(0, (item.activationGoalEntries || 0) - (item.totalEntriesToday || 0));
  const showEndsIn = item.state === "ACTIVATED" && !!item.closesAt;
  const closed = item.state === "CLOSED" || item.state === "PUBLISHED";
  const deepLink = item.state === "PUBLISHED" ? `/item/${item.id}/leaderboard` : `/item/${item.id}`;

  const hot = useMemo(() => {
    if (closed) return false;
    if (item.state === "ACTIVATED") return true;
    if (item.state === "OPEN" && pct >= 67) return true;
    if (item.state === "OPEN" && remaining <= 1) return true;

    const mins = minutesLeft(item.closesAt);
    if (item.state === "ACTIVATED" && mins != null && mins <= 3) return true;

    return false;
  }, [item.state, pct, remaining, item.closesAt, closed]);

  const urgencyText = useMemo(() => {
    if (closed) return "Results available";
    if (item.state === "ACTIVATED") return "Live now";
    if (item.state === "OPEN" && remaining > 0 && remaining <= 1) return `Only ${remaining} more play to go`;
    if (item.state === "OPEN" && pct >= 67) return "Almost live";
    return null;
  }, [item.state, remaining, pct, closed]);

  const gLabel = gameLabel(item.gameKey);

  return (
    <Link
      href={deepLink}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative flex h-[180px] items-center justify-center overflow-hidden bg-slate-50 p-4">
        {item.imageUrl && imgOk ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className="max-h-full max-w-full object-contain transition duration-300 group-hover:scale-[1.03]"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="text-xs text-slate-500">Image missing</div>
        )}

        <div className="absolute right-3 top-3 rounded-full bg-slate-900 px-3 py-1 text-xs font-extrabold text-white shadow">
          {formatZAR(item.prizeValueZAR)}
        </div>

        {hot ? (
          <div className="absolute left-3 top-3 rounded-full bg-amber-300 px-3 py-1 text-[11px] font-extrabold text-slate-900 shadow">
            Hot
          </div>
        ) : null}

        {showEndsIn ? (
          <div className="absolute left-3 bottom-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-900 shadow ring-1 ring-slate-200 backdrop-blur">
            Ends in <CountdownChip state={item.state} closesAt={item.closesAt ?? null} />
          </div>
        ) : null}

        {closed ? (
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-12 top-8 w-[320px] -rotate-12 bg-slate-900/90 px-4 py-2 text-center text-xs font-extrabold uppercase tracking-wide text-white shadow">
              Prize claimed
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-base font-extrabold text-slate-900">{item.title}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
              {gLabel ? (
                <span className="rounded-full bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 ring-1 ring-slate-200">
                  {gLabel}
                </span>
              ) : null}
              {urgencyText ? <span className="font-semibold text-slate-700">{urgencyText}</span> : null}
            </div>
          </div>
          <div className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-extrabold text-slate-900 ring-1 ring-slate-200">
            {pct}%
          </div>
        </div>

        <div className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Activation progress</div>
        <div className="mt-1 flex items-center justify-between gap-2 text-sm text-slate-700">
          <span>
            {item.totalEntriesToday}/{item.activationGoalEntries} plays
          </span>
          <span className="font-semibold text-slate-900">
            {item.playCostCredits ?? 0} {(item.playCostCredits ?? 0) === 1 ? "credit" : "credits"}/play
          </span>
        </div>

        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full bg-slate-900 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </Link>
  );
}
