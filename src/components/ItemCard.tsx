"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CountdownChip } from "@/components/CountdownChip";
import { getProductContent } from "@/lib/productCatalog";
import { activationStageLabel } from "@/lib/playCost";

export type ItemCardModel = {
  id: string;
  title: string;
  prizeValueZAR: number;
  state: string;
  imageUrl: string | null;
  closesAt?: string | null;
  playCostCredits?: number;
  gameKey?: string | null;
  activationPct?: number;
  activationLabel?: string;
};

function formatZAR(v: number) {
  return `R${Number(v || 0).toLocaleString("en-ZA")}`;
}

function gameLabel(k?: string | null) {
  if (!k) return null;
  if (k === "precision-timer") return "Quick Stop";
  if (k === "rhythm-hold") return "Rhythm Hold";
  if (k === "tap-speed") return "Tap Rush";
  if (k === "number-memory") return "Memory Sprint";
  if (k === "target-hold") return "Zone Hold";
  if (k === "stop-zero") return "Stop Zero";
  if (k === "tap-pattern") return "Tap Pattern";
  return k;
}

export function ItemCard({ item }: { item: ItemCardModel }) {
  const [imgOk, setImgOk] = useState(true);
  const pct = Math.max(0, Math.min(100, Number(item.activationPct ?? 0)));
  const isClosed = item.state === "CLOSED" || item.state === "PUBLISHED";
  const isActivated = item.state === "ACTIVATED";
  const href = item.state === "PUBLISHED" ? `/item/${item.id}/leaderboard` : `/item/${item.id}`;
  const gLabel = gameLabel(item.gameKey);
  const displayImage = getProductContent(item.title, item.imageUrl)?.imageUrl ?? item.imageUrl;
  const hot = useMemo(() => !isClosed && !isActivated && pct >= 75, [isClosed, isActivated, pct]);

  const statusTone = isClosed
    ? "bg-slate-900 text-white"
    : isActivated
      ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
      : "bg-slate-100 text-slate-700 ring-1 ring-slate-200";

  const statusText = isClosed ? "Won" : isActivated ? "Activated" : "Open";

  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative flex h-[138px] items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 to-white p-3">
        {displayImage && imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayImage}
            alt={item.title}
            className="max-h-full max-w-full object-contain transition duration-300 group-hover:scale-[1.03]"
            onError={() => setImgOk(false)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="text-sm font-semibold text-slate-400">Image unavailable</div>
        )}

        <div className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-extrabold text-slate-900 shadow ring-1 ring-slate-200">
          {formatZAR(item.prizeValueZAR)}
        </div>

        <div className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-extrabold shadow-sm ${statusTone}`}>
          {statusText}
        </div>

        {hot ? (
          <div className="absolute left-3 bottom-3 rounded-full bg-amber-300 px-2.5 py-1 text-[10px] font-extrabold text-slate-900 shadow">
            Hot
          </div>
        ) : null}

        {isActivated && item.closesAt ? (
          <div className="absolute bottom-3 right-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-slate-800 shadow ring-1 ring-slate-200">
            Ends in <CountdownChip state={item.state} closesAt={item.closesAt} />
          </div>
        ) : null}

        {isClosed ? (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-[-28%] top-[41%] w-[156%] -rotate-12 bg-slate-900/95 px-4 py-2 text-center text-[11px] font-extrabold tracking-wide text-white shadow-xl">
              PRIZE WON
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-2.5 p-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-extrabold text-slate-900">{item.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-600">
            {gLabel ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700 ring-1 ring-slate-200">
                {gLabel}
              </span>
            ) : null}
            {typeof item.playCostCredits === "number" ? (
              <span>
                {item.playCostCredits} {item.playCostCredits === 1 ? "credit" : "credits"}/play
              </span>
            ) : null}
          </div>
        </div>

        {!isClosed ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600">
              <span>Activation</span>
              <span>{isActivated ? "Activated" : activationStageLabel(pct)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-slate-900 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        ) : (
          <div className="text-[10px] text-slate-500">View results or buy the prize if you didn’t win.</div>
        )}
      </div>
    </Link>
  );
}

export default ItemCard;
