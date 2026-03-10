"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CountdownChip } from "@/components/CountdownChip";
import { getProductContent } from "@/lib/productCatalog";
import { activationStageLabel } from "@/lib/playCost";
import { ProductImage } from "@/components/ProductImage";

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
  if (k === "memory-sprint" || k === "number-memory") return "Memory Sprint";
  if (k === "quick-stop" || k === "precision-timer" || k === "stop-zero") return "Quick Stop";
  if (k === "moving-zone" || k === "rhythm-hold") return "Moving Zone Hold";
  if (k === "trace-run") return "Trace Run";
  if (k === "flash-count" || k === "burst-match" || k === "tap-speed" || k === "tap-pattern") return "Flash Count";
  if (k === "target-grid" || k === "target-hold") return "Target Grid";
  return k;
}

export function ItemCard({ item }: { item: ItemCardModel }) {
  const pct = Math.max(0, Math.min(100, Number(item.activationPct ?? 0)));
  const isClosed = item.state === "CLOSED" || item.state === "PUBLISHED";
  const isActivated = item.state === "ACTIVATED";
  const href = item.state === "PUBLISHED" ? `/item/${item.id}/leaderboard` : `/item/${item.id}`;
  const gLabel = gameLabel(item.gameKey);
  const product = getProductContent(item.title, item.imageUrl);
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
      className="group relative h-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative flex min-h-[156px] items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 to-white p-3 sm:min-h-[176px] md:min-h-[188px]">
        <ProductImage
          primarySrc={item.imageUrl}
          fallbackSrc={product?.imageUrl ?? null}
          alt={item.title}
          className="flex items-center justify-center"
          imgClassName="max-h-[126px] max-w-full object-contain transition duration-300 group-hover:scale-[1.03] sm:max-h-[142px] md:max-h-[154px]"
        />

        <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-extrabold text-slate-900 shadow ring-1 ring-slate-200">
          {formatZAR(item.prizeValueZAR)}
        </div>

        <div className={`absolute right-3 top-3 rounded-full px-3 py-1 text-[11px] font-extrabold shadow-sm ${statusTone}`}>
          {statusText}
        </div>

        {hot ? (
          <div className="absolute left-3 bottom-3 rounded-full bg-amber-300 px-3 py-1 text-[11px] font-extrabold text-slate-900 shadow">
            Hot
          </div>
        ) : null}

        {isActivated && item.closesAt ? (
          <div className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-slate-800 shadow ring-1 ring-slate-200">
            Ends in <CountdownChip state={item.state} closesAt={item.closesAt} />
          </div>
        ) : null}

        {isClosed ? (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-[-24%] top-[42%] w-[148%] -rotate-12 bg-slate-900/95 px-4 py-2 text-center text-[10px] font-extrabold tracking-wide text-white shadow-xl sm:text-xs">
              PRIZE WON • NEXT PRIZE LOADING
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-2.5 p-3 sm:p-4">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-extrabold text-slate-900 sm:text-base">{item.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-600 sm:text-xs">
            {gLabel ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700 ring-1 ring-slate-200">
                {gLabel}
              </span>
            ) : null}
            {typeof item.playCostCredits === "number" ? <span>{item.playCostCredits} credits/play</span> : null}
          </div>
        </div>

        {!isClosed ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
              <span>Activation progress</span>
              <span>{isActivated ? "Activated" : activationStageLabel(pct)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-slate-900 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-slate-500">View results or buy the prize if you didn’t win.</div>
        )}
      </div>
    </Link>
  );
}

export default ItemCard;
