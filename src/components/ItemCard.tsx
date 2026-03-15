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

  const statusText = isClosed ? "Won" : isActivated ? "Activated" : "Open";

  return (
    <Link
      href={href}
      className="group relative flex h-full min-h-0 cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.18)]"
    >
      {isClosed ? (
        <div className="pointer-events-none absolute left-[-18%] top-[46%] z-30 w-[136%] -translate-y-1/2 -rotate-12 bg-slate-950/96 px-4 py-2 text-center text-[10px] font-extrabold tracking-[0.18em] text-white shadow-xl lg:px-3 lg:py-1.5 lg:text-[9px] sm:text-xs">
          PRIZE WON • CLOSED
        </div>
      ) : null}

      <div className="relative flex min-h-[190px] items-center justify-center bg-gradient-to-b from-slate-50 to-white p-6 lg:min-h-[118px] lg:p-3">
        <ProductImage
          primarySrc={primaryImage}
          fallbackSrc={fallbackImage}
          alt={item.title}
          className="flex w-full items-center justify-center"
          imgClassName="max-h-[138px] max-w-full object-contain transition duration-300 group-hover:scale-[1.03] lg:max-h-[84px]"
        />

        <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-extrabold text-slate-900 shadow ring-1 ring-slate-200 lg:left-3 lg:top-3 lg:px-2.5 lg:py-1 lg:text-[10px]">
          {formatZAR(item.prizeValueZAR)}
        </div>

        <div className={`absolute right-4 top-4 rounded-full px-3 py-1.5 text-xs font-extrabold shadow-sm lg:right-3 lg:top-3 lg:px-2.5 lg:py-1 lg:text-[10px] ${statusTone}`}>
          {statusText}
        </div>

        {hot ? (
          <div className="animate-pwnit-pulse-soft absolute bottom-4 left-4 rounded-full bg-amber-300 px-3 py-1.5 text-xs font-extrabold text-slate-900 shadow-sm lg:bottom-3 lg:left-3 lg:px-2.5 lg:py-1 lg:text-[10px]">
            Hot
          </div>
        ) : null}

        {isActivated && item.closesAt ? (
          <div className="absolute bottom-4 right-4 lg:bottom-3 lg:right-3">
            <CountdownChip state={item.state} closesAt={item.closesAt} />
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3 p-5 lg:gap-2 lg:p-3">
        <div>
          <h3 className="line-clamp-2 text-lg font-extrabold leading-tight text-slate-900 lg:text-[15px]">{item.title}</h3>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs lg:mt-1.5 lg:gap-1.5 lg:text-[11px]">
            {gLabel ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 ring-1 ring-slate-200 lg:px-2.5 lg:py-0.5">
                {gLabel}
              </span>
            ) : null}
            {typeof item.playCostCredits === "number" ? (
              <span className="text-slate-600">{item.playCostCredits} credits/play</span>
            ) : null}
          </div>
        </div>

        {!isClosed ? (
          <div className="space-y-2 lg:space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 lg:text-[11px]">
              <span>Activation progress</span>
              <span>{isActivated ? "Activated" : activationStageLabel(pct)}</span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-200 lg:h-2">
              <div
                className="h-full rounded-full bg-slate-900 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 lg:text-[11px]">View results or buy the prize if you didn’t win.</div>
        )}
      </div>
    </Link>
  );
}

export default ItemCard;
