"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CountdownChip } from "@/components/CountdownChip";

export type ItemCardModel = {
  id: string;
  title: string;
  prizeValueZAR: number;
  state: string;
  activationGoalEntries: number;
  totalEntriesToday: number;
  paidCreditsToday?: number;
  activationGoalCredits?: number;
  imageUrl: string | null;
  closesAt?: string | null;
  countdownMinutes?: number;
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
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (item.state !== "ACTIVATED" || !item.closesAt) return;
    const t = window.setInterval(() => setTick((x) => x + 1), 250);
    return () => window.clearInterval(t);
  }, [item.state, item.closesAt]);

  const paidToday = typeof item.paidCreditsToday === "number" ? item.paidCreditsToday : null;
  const goalCredits = typeof item.activationGoalCredits === "number" ? item.activationGoalCredits : null;
  const usingPaidProgress = paidToday != null && goalCredits != null;
  const pct = usingPaidProgress
    ? progressPct(paidToday, goalCredits)
    : progressPct(item.totalEntriesToday, item.activationGoalEntries);

  const remainingEntries = Math.max(0, (item.activationGoalEntries || 0) - (item.totalEntriesToday || 0));
  const remainingCredits = usingPaidProgress ? Math.max(0, (goalCredits || 0) - (paidToday || 0)) : 0;

  const showEndsIn = item.state === "ACTIVATED" && !!item.closesAt;
  const closed = item.state === "CLOSED" || item.state === "PUBLISHED";
  const deepLink = item.state === "PUBLISHED" ? `/item/${item.id}/leaderboard` : `/item/${item.id}`;

  const hot = useMemo(() => {
    if (closed) return false;
    if (item.state === "ACTIVATED") return true;
    if (item.state === "OPEN" && pct >= 80) return true;
    if (!usingPaidProgress && item.state === "OPEN" && remainingEntries <= 2) return true;
    if (usingPaidProgress && item.state === "OPEN" && remainingCredits <= 50) return true;
    const mins = minutesLeft(item.closesAt);
    if (item.state === "ACTIVATED" && mins != null && mins <= 3) return true;
    return false;
  }, [closed, item.state, pct, usingPaidProgress, remainingEntries, remainingCredits, item.closesAt]);

  const urgencyText = useMemo(() => {
    if (closed) return "Results available";
    if (item.state === "ACTIVATED") return "Live now";
    if (usingPaidProgress && item.state === "OPEN" && remainingCredits > 0 && remainingCredits <= 100) {
      return `${formatZAR(remainingCredits)} to go`;
    }
    if (!usingPaidProgress && item.state === "OPEN" && remainingEntries > 0 && remainingEntries <= 2) {
      return `Only ${remainingEntries} more to go`;
    }
    if (item.state === "OPEN" && pct >= 80) return "Almost live";
    return "Open now";
  }, [closed, item.state, usingPaidProgress, remainingCredits, remainingEntries, pct]);

  const showCost = typeof item.playCostCredits === "number";
  const gLabel = gameLabel(item.gameKey);

  const countdownPct = useMemo(() => {
    if (!showEndsIn) return null;
    const totalMs = Math.max(1, Number(item.countdownMinutes ?? 5) * 60_000);
    const endMs = Date.parse(item.closesAt as string);
    if (!Number.isFinite(endMs)) return null;
    const remainingMs = Math.max(0, endMs - Date.now());
    return Math.max(0, Math.min(100, Math.round((remainingMs / totalMs) * 100)));
  }, [showEndsIn, item.closesAt, item.countdownMinutes, tick]);

  return (
    <Link
      href={deepLink}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {item.imageUrl && imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-contain p-5 transition duration-300 group-hover:scale-[1.03]"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-500">
            Image missing
          </div>
        )}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/70 bg-white/90 px-2.5 py-1 text-[11px] font-bold tracking-wide text-slate-800 backdrop-blur">
              {urgencyText}
            </span>
            {hot ? (
              <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-slate-950">
                HOT
              </span>
            ) : null}
          </div>

          <div className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-extrabold text-white shadow-sm">
            {formatZAR(item.prizeValueZAR)}
          </div>
        </div>

        {showEndsIn ? (
          <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/60 bg-white/88 px-3 py-2 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-700">
              <span>Ends in</span>
              <CountdownChip state={item.state} closesAtIso={item.closesAt ?? null} labelWhenClosed="Closed" />
            </div>
            {typeof countdownPct === "number" ? (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-slate-900 transition-[width] duration-200"
                  style={{ width: `${countdownPct}%` }}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {closed ? (
          <div className="pointer-events-none absolute left-[-28%] top-[42%] w-[156%] -rotate-12 bg-slate-950/92 py-2.5 text-center text-xs font-extrabold uppercase tracking-[0.22em] text-white shadow-xl">
            Item already won · New item loading
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="min-h-[3.25rem]">
          <h3 className="line-clamp-2 text-base font-extrabold leading-tight text-slate-950 group-hover:text-slate-700">
            {item.title}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {gLabel ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                {gLabel}
              </span>
            ) : null}
            {showCost ? (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                {item.playCostCredits} {item.playCostCredits === 1 ? "credit" : "credits"}/play
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Activation progress
              </div>
              <div className="mt-0.5 text-sm font-semibold text-slate-900">
                {usingPaidProgress ? (
                  <>
                    {formatZAR(paidToday || 0)} <span className="text-slate-500">of</span> {formatZAR(goalCredits || 0)}
                  </>
                ) : (
                  <>
                    {item.totalEntriesToday} <span className="text-slate-500">of</span> {item.activationGoalEntries} entries
                  </>
                )}
              </div>
            </div>
            <div className="rounded-full bg-white px-2.5 py-1 text-xs font-extrabold text-slate-900 shadow-sm">
              {pct}%
            </div>
          </div>

          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-slate-700 via-slate-900 to-slate-700 transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="mt-2 text-xs text-slate-600">
            {usingPaidProgress ? (
              item.state === "OPEN" ? (
                <>
                  <span className="font-semibold text-slate-900">{formatZAR(remainingCredits)}</span> still needed before the countdown starts.
                </>
              ) : (
                <>Activation target reached.</>
              )
            ) : item.state === "OPEN" ? (
              <>
                <span className="font-semibold text-slate-900">{remainingEntries}</span> more entries needed before the countdown starts.
              </>
            ) : (
              <>Activation target reached.</>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ItemCard;
