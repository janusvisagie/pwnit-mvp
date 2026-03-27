"use client";

import Link from "next/link";
import { useMemo } from "react";

import { activationStageLabel } from "@/lib/playCost";
import { getFallbackProductImage, getProductContent } from "@/lib/productCatalog";
import { getGameLabel } from "@/lib/gameRules";

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
  const isPlayable = normalizedState === "OPEN" || normalizedState === "BUILDING" || normalizedState === "ACTIVATED";
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
      : "bg-white/90 text-slate-700 ring-1 ring-slate-200 backdrop-blur";

  return (
    <Link
      href={href}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {isClosed ? (
        <div className="absolute left-[-4rem] top-4 z-20 rotate-[-32deg] bg-slate-950 px-16 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white sm:text-[11px]">
          Prize Won
        </div>
      ) : null}

      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={item.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : null}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <div className="rounded-full bg-white/92 px-3 py-1 text-sm font-black text-slate-950 shadow-sm backdrop-blur">
            {formatZAR(item.prizeValueZAR)}
          </div>
          <div className={`rounded-full px-3 py-1 text-[11px] font-bold ${badgeTone}`}>
            {isClosed ? "Closed" : isActivated ? "Activated" : "Open"}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="min-h-[2.35rem] text-[15px] font-black leading-tight text-slate-950 sm:text-base">
          {item.title}
        </h3>

        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-600">
          {game ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-800">{game}</span> : null}
          {typeof item.playCostCredits === "number" ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-1">{item.playCostCredits} credits/play</span>
          ) : null}
          {hot ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">Hot</span> : null}
        </div>

        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <span>Activation</span>
            <span className="truncate text-right normal-case tracking-normal">{progressText}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ItemCard;
