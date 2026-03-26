"use client";

import Link from "next/link";
import { useMemo } from "react";

import { CountdownChip } from "@/components/CountdownChip";
import { ProductImage } from "@/components/ProductImage";
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

function gameLabel(k?: string | null) {
  if (!k) return null;
  if (k === "memory-sprint" || k === "number-memory") return "Memory Sprint";
  if (k === "alphabet-sprint" || k === "trace-run") return "Alphabet Sprint";
  if (k === "quick-stop" || k === "precision-timer" || k === "stop-zero") return "Quick Stop";
  if (k === "moving-zone" || k === "rhythm-hold") return "Moving Zone Hold";
  if (k === "flash-count" || k === "burst-match" || k === "tap-speed" || k === "tap-pattern") return "Flash Count";
  if (k === "target-grid" || k === "target-hold") return "Target Grid";
  return k.replace(/[-_]/g, " ");
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
  const primaryImage = product?.imageUrl ?? item.imageUrl ?? fallbackImage;
  const game = gameLabel(item.gameKey);
  const hot = useMemo(() => isPlayable && !isActivated && pct >= 75, [isPlayable, isActivated, pct]);

  const progressText = isActivated ? "Activated" : activationStageLabel(pct);
  const badgeTone = isClosed
    ? "bg-slate-900 text-white"
    : isActivated
      ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
      : "bg-slate-100 text-slate-700 ring-1 ring-slate-200";

  return (
    <Link
      href={href}
      className="group flex h-full min-h-[205px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative">
        <ProductImage
          primarySrc={primaryImage}
          fallbackSrc={fallbackImage}
          alt={item.title}
          className="bg-slate-50"
          imgClassName="h-20 w-full object-contain bg-white p-2 sm:h-24"
        />

        {isClosed ? (
          <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center">
            <span className="rounded-full bg-slate-950 px-2 py-1 text-[10px] font-bold tracking-wide text-white">
              CLOSED
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="text-[14px] font-black text-slate-950">{formatZAR(item.prizeValueZAR)}</div>
          <div className={`rounded-full px-2 py-1 text-[10px] font-semibold ${badgeTone}`}>
            {isClosed ? "Closed" : isActivated ? "Activated" : "Open"}
          </div>
        </div>

        <h3 className="mt-1 line-clamp-2 text-[12px] font-black leading-tight text-slate-950">
          {item.title}
        </h3>

        <div className="mt-1 flex flex-wrap items-center gap-1">
          {game ? (
            <span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-bold text-blue-700 ring-1 ring-blue-200">
              {game}
            </span>
          ) : null}

          {typeof item.playCostCredits === "number" ? (
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-700 ring-1 ring-slate-200">
              {item.playCostCredits} credits/play
            </span>
          ) : null}

          {hot ? (
            <span className="rounded-full bg-orange-100 px-2 py-1 text-[9px] font-semibold text-orange-800 ring-1 ring-orange-200">
              Hot
            </span>
          ) : null}
        </div>

        <div className="mt-auto pt-2">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
              Activation
            </span>
            {isActivated && item.closesAt ? <CountdownChip closesAt={item.closesAt} state="ACTIVATED" /> : null}
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-slate-900 transition-all"
              style={{ width: `${Math.max(6, pct)}%` }}
            />
          </div>

          <div className="mt-1 text-[10px] text-slate-600">{progressText}</div>
        </div>
      </div>
    </Link>
  );
}

export default ItemCard;
