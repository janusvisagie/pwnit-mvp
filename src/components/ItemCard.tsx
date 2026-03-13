"use client";

import Link from "next/link";
import { useMemo } from "react";

import { CountdownChip } from "@/components/CountdownChip";
import { ProductImage } from "@/components/ProductImage";
import { getFallbackProductImage, getProductContent } from "@/lib/productCatalog";
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
  if (k === "memory-sprint" || k === "number-memory") return "Memory Sprint";
  if (k === "alphabet-sprint" || k === "trace-run") return "Alphabet Sprint";
  if (k === "quick-stop" || k === "precision-timer" || k === "stop-zero") return "Quick Stop";
  if (k === "moving-zone" || k === "rhythm-hold") return "Moving Zone Hold";
  if (k === "flash-count" || k === "burst-match" || k === "tap-speed" || k === "tap-pattern") {
    return "Flash Count";
  }
  if (k === "target-grid" || k === "target-hold") return "Target Grid";
  return k;
}

export function ItemCard({ item }: { item: ItemCardModel }) {
  const pct = Math.max(0, Math.min(100, Number(item.activationPct ?? 0)));
  const normalizedState = (item.state || "").toUpperCase();
  const isActivated = normalizedState === "ACTIVATED";
  const isPlayable = normalizedState === "OPEN" || normalizedState === "ACTIVATED";
  const isClosed = !isPlayable;

  const href = isClosed ? `/item/${item.id}/leaderboard` : `/item/${item.id}`;
  const gLabel = gameLabel(item.gameKey);

  const product = getProductContent(item.title, item.imageUrl);
  const fallbackImage = getFallbackProductImage(item.title, item.imageUrl);
  const primaryImage = product?.imageUrl ?? item.imageUrl ?? fallbackImage;

  const hot = useMemo(() => isPlayable && !isActivated && pct >= 75, [isPlayable, isActivated, pct]);

  const statusTone = isClosed
    ? "bg-slate-900 text-white"
    : isActivated
      ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
      : "bg-slate-100 text-slate-700 ring-1 ring-slate-200";

  const statusText = isClosed ? "Closed" : isActivated ? "Activated" : "Open";

  return (
    <Link
      href={href}
      className="group relative flex h-full min-h-[186px] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:min-h-[194px] lg:min-h-0"
    >
      {isClosed ? (
        <div className="pointer-events-none absolute left-[-20%] top-1/2 z-20 w-[140%] -translate-y-1/2 -rotate-12 bg-slate-900/95 px-4 py-2 text-center text-[10px] font-extrabold tracking-[0.16em] text-white shadow-xl sm:text-xs">
          PRIZE WON • CLOSED
        </div>
      ) : null}

      <div className="relative flex min-h-[92px] items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 to-white px-4 py-3 sm:min-h-[98px] lg:min-h-[clamp(82px,9vh,108px)] xl:min-h-[clamp(92px,10vh,124px)]">
        <ProductImage
          primarySrc={primaryImage}
          fallbackSrc={fallbackImage}
          alt={item.title}
          className="flex items-center justify-center"
          imgClassName="max-h-[78px] max-w-full object-contain transition duration-300 group-hover:scale-[1.03] sm:max-h-[84px] lg:max-h-[88px] xl:max-h-[102px] 2xl:max-h-[112px]"
        />

        <div className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-extrabold text-slate-900 shadow ring-1 ring-slate-200 sm:text-[11px]">
          {formatZAR(item.prizeValueZAR)}
        </div>

        <div className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-extrabold shadow-sm sm:text-[11px] ${statusTone}`}>
          {statusText}
        </div>

        {hot ? (
          <div className="absolute bottom-3 left-3 rounded-full bg-amber-300 px-2.5 py-1 text-[10px] font-extrabold text-slate-900 shadow sm:text-[11px]">
            Hot
          </div>
        ) : null}

        {isActivated && item.closesAt ? (
          <div className="absolute bottom-3 right-3">
            <CountdownChip state={item.state} closesAt={item.closesAt} />
          </div>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between gap-2 p-3.5 lg:p-3.5 xl:p-4">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-[15px] font-extrabold leading-tight text-slate-900 xl:text-[16px] 2xl:text-[17px]">
            {item.title}
          </h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] leading-tight text-slate-600 sm:text-[12px] xl:text-[12.5px]">
            {gLabel ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-700 ring-1 ring-slate-200">
                {gLabel}
              </span>
            ) : null}

            {typeof item.playCostCredits === "number" ? <span>{item.playCostCredits} credits/play</span> : null}
          </div>
        </div>

        {!isClosed ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-600 sm:text-[12px] xl:text-[12.5px]">
              <span className="truncate">Activation progress</span>
              <span className="shrink-0">{isActivated ? "Activated" : activationStageLabel(pct)}</span>
            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-slate-900 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-slate-500 sm:text-[12px] xl:text-[12.5px]">
            View results or buy the prize if you didn’t win.
          </div>
        )}
      </div>
    </Link>
  );
}

export default ItemCard;
