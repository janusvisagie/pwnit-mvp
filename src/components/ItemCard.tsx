"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CountdownChip } from "@/components/CountdownChip";
import { getFallbackProductImage, getProductContent } from "@/lib/productCatalog";
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
  if (k === "alphabet-sprint" || k === "trace-run") return "Alphabet Sprint";
  if (k === "quick-stop" || k === "precision-timer" || k === "stop-zero") return "Quick Stop";
  if (k === "moving-zone" || k === "rhythm-hold") return "Moving Zone Hold";
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
  const fallbackImage = getFallbackProductImage(item.title, item.imageUrl);
  const primaryImage = product?.imageUrl ?? item.imageUrl ?? fallbackImage;
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
      className="group relative flex h-full min-h-0 flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative flex min-h-[104px] items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 to-white p-2 sm:min-h-[112px] md:min-h-[118px]">
        <ProductImage
          primarySrc={primaryImage}
          fallbackSrc={fallbackImage}
          alt={item.title}
          className="flex items-center justify-center"
          imgClassName="max-h-[78px] max-w-full object-contain transition duration-300 group-hover:scale-[1.03] sm:max-h-[88px] md:max-h-[92px]"
        />

        <div className="absolute left-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-extrabold text-slate-900 shadow ring-1 ring-slate-200">
          {formatZAR(item.prizeValueZAR)}
        </div>

        <div className={`absolute right-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-extrabold shadow-sm ${statusTone}`}>
          {statusText}
        </div>

        {hot ? (
          <div className="absolute left-2 bottom-2 rounded-full bg-amber-300 px-2.5 py-1 text-[10px] font-extrabold text-slate-900 shadow">
            Hot
          </div>
        ) : null}

        {isActivated && item.closesAt ? (
          <div className="absolute bottom-2 right-2 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-slate-800 shadow ring-1 ring-slate-200">
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

      <div className="flex min-h-0 flex-1 flex-col justify-between gap-1.5 p-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-[14px] font-extrabold leading-tight text-slate-900 sm:text-[15px] md:line-clamp-1">
            {item.title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] leading-tight text-slate-600 sm:text-[11px]">
            {gLabel ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700 ring-1 ring-slate-200">
                {gLabel}
              </span>
            ) : null}
            {typeof item.playCostCredits === "number" ? <span>{item.playCostCredits} credits/play</span> : null}
          </div>
        </div>

        {!isClosed ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-slate-600 sm:text-[11px]">
              <span className="truncate">Activation progress</span>
              <span className="shrink-0">{isActivated ? "Activated" : activationStageLabel(pct)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-slate-900 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        ) : (
          <div className="text-[10px] text-slate-500 sm:text-[11px]">View results or buy the prize if you didn’t win.</div>
        )}
      </div>
    </Link>
  );
}

export default ItemCard;
