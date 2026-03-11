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
  if (k === "alphabet-sprint") return "Alphabet Sprint";
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
      className="group relative flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative flex min-h-[112px] items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 to-white p-2.5 sm:min-h-[124px] md:min-h-[132px]">
        <ProductImage
          primarySrc={primaryImage}
          fallbackSrc={fallbackImage}
          alt={item.title}
          className="flex items-center justify-center"
          imgClassName="max-h-[88px] max-w-full object-contain transition duration-300 group-hover:scale-[1.03] sm:max-h-[98px] md:max-h-[108px]"
        />

        <div className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-extrabold text-slate-900 shadow ring-1 ring-slate-200 sm:text-[11px]">
          {formatZAR(item.prizeValueZAR)}
        </div>

        <div className={`absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold shadow-sm sm:text-[11px] ${statusTone}`}>
          {statusText}
        </div>

        {hot ? (
          <div className="absolute left-2.5 bottom-2.5 rounded-full bg-amber-300 px-2.5 py-1 text-[10px] font-extrabold text-slate-900 shadow sm:text-[11px]">
            Hot
          </div>
        ) : null}

        {isActivated && item.closesAt ? (
          <div className="absolute bottom-2.5 right-2.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-slate-800 shadow ring-1 ring-slate-200 sm:text-[11px]">
            Ends in <CountdownChip state={item.state} closesAt={item.closesAt} />
          </div>
        ) : null}

        {isClosed ? (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-[-28%] top-[43%] w-[156%] -rotate-12 bg-slate-900/95 px-4 py-1.5 text-center text-[9px] font-extrabold tracking-wide text-white shadow-xl sm:text-[10px]">
              PRIZE WON • NEXT PRIZE LOADING
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between gap-2 p-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-extrabold text-slate-900 sm:text-[15px]">{item.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-600 sm:text-[11px]">
            {gLabel ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700 ring-1 ring-slate-200">
                {gLabel}
              </span>
            ) : null}
            {typeof item.playCostCredits === "number" ? <span>{item.playCostCredits} credits/play</span> : null}
          </div>
        </div>

        {!isClosed ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-600 sm:text-[11px]">
              <span>Activation progress</span>
              <span>{isActivated ? "Activated" : activationStageLabel(pct)}</span>
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
