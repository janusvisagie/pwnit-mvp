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

function gameLabel(key?: string | null) {
  if (!key) return null;
  if (key === "memory-sprint" || key === "number-memory") return "Memory Sprint";
  if (key === "alphabet-sprint") return "Alphabet Sprint";
  if (key === "quick-stop" || key === "precision-timer" || key === "stop-zero") return "Quick Stop";
  if (key === "moving-zone" || key === "rhythm-hold") return "Moving Zone Hold";
  if (key === "trace-run") return "Trace Run";
  if (
    key === "flash-count" ||
    key === "burst-match" ||
    key === "tap-speed" ||
    key === "tap-pattern"
  ) {
    return "Flash Count";
  }
  if (key === "target-grid" || key === "target-hold") return "Target Grid";
  return key;
}

export function ItemCard({ item }: { item: ItemCardModel }) {
  const pct = Math.max(0, Math.min(100, Number(item.activationPct ?? 0)));
  const isClosed = item.state === "CLOSED" || item.state === "PUBLISHED";
  const isActivated = item.state === "ACTIVATED";
  const href = item.state === "PUBLISHED" ? `/item/${item.id}/leaderboard` : `/item/${item.id}`;
  const label = gameLabel(item.gameKey);

  const product = getProductContent(item.title, item.imageUrl);
  const fallbackImage = getFallbackProductImage(item.title, item.imageUrl);
  const primaryImage = product?.imageUrl ?? item.imageUrl ?? fallbackImage;

  const hot = useMemo(
    () => !isClosed && !isActivated && pct >= 75,
    [isClosed, isActivated, pct],
  );

  const statusTone = isClosed
    ? "bg-slate-900 text-white"
    : isActivated
      ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
      : "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  const statusText = isClosed ? "Won" : isActivated ? "Activated" : "Open";

  return (
    <Link
      href={href}
      className="group flex h-full min-h-[260px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md xl:min-h-[280px]"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-black text-slate-950 shadow-sm">
          {formatZAR(item.prizeValueZAR)}
        </span>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${statusTone}`}>
            {statusText}
          </span>
          {hot ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-800 ring-1 ring-amber-200">
              Hot
            </span>
          ) : null}
          {isActivated && item.closesAt ? (
            <span className="rounded-full bg-white px-2 py-1 ring-1 ring-slate-200">
              <CountdownChip endsAt={item.closesAt} compact label="Ends in" />
            </span>
          ) : null}
        </div>
      </div>

      <div className="mb-3 flex min-h-[94px] items-center justify-center rounded-[22px] bg-slate-50 px-3 py-3 md:min-h-[108px] xl:min-h-[118px]">
        <ProductImage
          primarySrc={primaryImage}
          fallbackSrc={fallbackImage}
          alt={item.title}
          className="flex h-full w-full items-center justify-center"
          imgClassName="max-h-[84px] w-auto max-w-full object-contain md:max-h-[98px] xl:max-h-[108px]"
        />
      </div>

      <div className="flex flex-1 flex-col">
        <h3 className="line-clamp-2 text-[1.15rem] font-black leading-tight tracking-tight text-slate-950">
          {item.title}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          {label ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 ring-1 ring-slate-200">
              {label}
            </span>
          ) : null}
          {typeof item.playCostCredits === "number" ? (
            <span>{item.playCostCredits} credits/play</span>
          ) : null}
        </div>

        <div className="mt-auto pt-4">
          {!isClosed ? (
            <>
              <div className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-slate-600">
                <span>Activation progress</span>
                <span>{isActivated ? "Activated" : activationStageLabel(pct)}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full transition-all ${
                    isActivated ? "bg-emerald-500" : "bg-slate-900"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-600">
              View results or buy the prize if you didn&apos;t win.
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export default ItemCard;
