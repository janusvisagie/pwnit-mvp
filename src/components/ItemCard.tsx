"use client";

import Link from "next/link";
import { useMemo } from "react";

import { CountdownChip } from "@/components/CountdownChip";
import { ProductImage } from "@/components/ProductImage";
import { getGameLabel } from "@/lib/gameRules";
import { activationStageLabel } from "@/lib/playCost";
import { getFallbackProductImage, getProductContent } from "@/lib/productCatalog";

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
};

function formatZAR(v: number) {
  return `R${Number(v || 0).toLocaleString("en-ZA")}`;
}

export function ItemCard({ item }: { item: ItemCardModel }) {
  const pct = Math.max(0, Math.min(100, Number(item.activationPct ?? 0)));
  const normalizedState = String(item.state || "").toUpperCase();
  const isActivated = normalizedState === "ACTIVATED";
  const isPlayable =
    normalizedState === "OPEN" || normalizedState === "BUILDING" || normalizedState === "ACTIVATED";
  const isClosed = !isPlayable;
  const href = isClosed ? `/item/${item.id}/leaderboard` : `/item/${item.id}`;

  const product = getProductContent(item.title, item.imageUrl);
  const fallbackImage = getFallbackProductImage(item.title, item.imageUrl);
  const primaryImage = product?.imageUrl ?? item.imageUrl ?? fallbackImage ?? "";
  const game = item.gameKey ? getGameLabel(item.gameKey) : null;

  const hot = useMemo(() => isPlayable && !isActivated && pct >= 75, [isPlayable, isActivated, pct]);
  const progressText = isActivated ? "Activated" : activationStageLabel(pct);
  const badgeTone = isClosed
    ? "bg-slate-900 text-white"
    : isActivated
      ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
      : "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  const helperText = isActivated
    ? "Countdown is running now."
    : "Players join, play and share to move this prize live.";
  const progressWidth = isActivated ? 100 : Math.max(pct, pct > 0 ? 8 : 4);

  return (
    <Link
      href={href}
      className="group flex h-full min-h-[220px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md lg:h-[calc((100vh-4.35rem)/2)]"
    >
      <div className="relative border-b border-slate-100 bg-slate-50/80">
        <ProductImage
          primarySrc={primaryImage}
          fallbackSrc={fallbackImage}
          alt={item.title}
          className="bg-slate-50/80"
          imgClassName="h-44 w-full object-contain bg-white p-4 sm:h-52 lg:h-[24vh]"
        />
        {isClosed ? (
          <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
            <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] font-bold tracking-wide text-white shadow-sm">
              Prize won
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
            {formatZAR(item.prizeValueZAR)}
          </div>
          <div className={`rounded-full px-3 py-1 text-[11px] font-semibold ${badgeTone}`}>
            {isClosed ? "Closed" : isActivated ? "Activated" : "Open"}
          </div>
        </div>

        <h3 className="line-clamp-2 text-base font-black leading-tight text-slate-950 sm:text-lg">
          {item.title}
        </h3>

        <div className="flex flex-wrap items-center gap-1.5">
          {game ? (
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 ring-1 ring-blue-200 sm:text-[11px]">
              {game}
            </span>
          ) : null}

          {typeof item.playCostCredits === "number" ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-700 ring-1 ring-slate-200 sm:text-[11px]">
              {item.playCostCredits} credits / play
            </span>
          ) : null}

          {hot ? (
            <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-semibold text-orange-800 ring-1 ring-orange-200 sm:text-[11px]">
              Hot
            </span>
          ) : null}
        </div>

        <div className="mt-auto rounded-3xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Activation progress
            </span>
            {isActivated && item.closesAt ? (
              <CountdownChip closesAt={item.closesAt} state="ACTIVATED" />
            ) : (
              <span className="text-sm font-black text-slate-950">{pct}%</span>
            )}
          </div>

          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all ${isActivated ? "bg-emerald-500" : "bg-slate-900"}`}
              style={{ width: `${progressWidth}%` }}
            />
          </div>

          <div className="mt-2 flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-slate-900">{progressText}</div>
              <div className="mt-0.5 text-xs leading-5 text-slate-600">{helperText}</div>
            </div>
            {!isActivated ? (
              <span className="text-[11px] font-semibold text-slate-500">Open prize</span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ItemCard;
