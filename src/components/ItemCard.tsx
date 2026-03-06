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
  if (!k) return "Skill game";
  if (k === "precision-timer") return "Precision Timer";
  if (k === "rhythm-hold") return "Rhythm Hold";
  if (k === "tap-speed") return "Tap Speed";
  if (k === "number-memory") return "Number Memory";
  if (k === "target-hold") return "Target Hold";
  if (k === "stop-zero") return "Stop Zero";
  if (k === "tap-pattern") return "Tap Pattern";
  return k;
}

function statusLabel(state: string, pct: number, remaining: number, closesAt?: string | null) {
  if (state === "PUBLISHED" || state === "CLOSED") return "Closed";
  if (state === "ACTIVATED") return "Live now";
  const mins = minutesLeft(closesAt);
  if (mins != null && mins <= 3) return "Ending soon";
  if (remaining <= 1) return "Almost live";
  if (pct >= 67) return "Going live soon";
  return "Open";
}

export function ItemCard({ item }: { item: ItemCardModel }) {
  const [imgOk, setImgOk] = useState(true);

  const pct = progressPct(item.totalEntriesToday, item.activationGoalEntries);
  const remaining = Math.max(0, (item.activationGoalEntries || 0) - (item.totalEntriesToday || 0));
  const closed = item.state === "CLOSED" || item.state === "PUBLISHED";
  const deepLink = item.state === "PUBLISHED" ? `/item/${item.id}/leaderboard` : `/item/${item.id}`;
  const showEndsIn = item.state === "ACTIVATED" && !!item.closesAt;
  const status = useMemo(() => statusLabel(item.state, pct, remaining, item.closesAt), [item.state, pct, remaining, item.closesAt]);
  const gLabel = gameLabel(item.gameKey);

  return (
    <Link
      href={deepLink}
      className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-100 to-white">
        {item.imageUrl && imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-contain p-5 transition duration-300 group-hover:scale-[1.03]"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">Image coming soon</div>
        )}

        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-slate-900 shadow-sm ring-1 ring-slate-200 backdrop-blur">
          {status}
        </div>

        <div className="absolute right-4 top-4 rounded-2xl bg-slate-900 px-3 py-1.5 text-sm font-extrabold text-white shadow">
          {formatZAR(item.prizeValueZAR)}
        </div>

        {showEndsIn ? (
          <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 backdrop-blur">
            <span className="mr-2 text-slate-600">Ends in</span>
            <CountdownChip state={item.state} closesAt={item.closesAt ?? null} />
          </div>
        ) : null}

        {closed ? (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-20 top-8 w-[140%] -rotate-12 bg-slate-900/92 py-2 text-center text-xs font-extrabold uppercase tracking-[0.18em] text-white shadow-lg">
              Closed
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="line-clamp-1 text-base font-extrabold text-slate-900">{item.title}</h3>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
            <span className="rounded-full bg-slate-50 px-2.5 py-1 font-semibold ring-1 ring-slate-200">{gLabel}</span>
            {typeof item.playCostCredits === "number" ? (
              <span>{item.playCostCredits} {item.playCostCredits === 1 ? "credit" : "credits"} / play</span>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
          <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-slate-500">
            <span>Activation threshold</span>
            <span>{item.activationGoalEntries} plays</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-slate-900 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-900">{item.totalEntriesToday} / {item.activationGoalEntries} plays</span>
            <span className="text-slate-600">{closed || item.state === "ACTIVATED" ? status : `${remaining} to go`}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
