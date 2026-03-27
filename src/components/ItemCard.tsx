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
  const badgeTone = isClosed ? "bg-slate-900 text-white" : isActivated ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200" : "bg-slate-100 text-slate-700 ring-1 ring-slate-200";

  return (
    <Link href={href} className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {isClosed ? (
        <div className="absolute left-[-3.75rem] top-5 z-10 rotate-[-32deg] bg-slate-950 px-16 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-white">
          Prize Won
        </div>
      ) : null}

      <div className="aspect-[4/3] w-full bg-slate-100">
        {primaryImage ? <img src={primaryImage} alt={item.title} className="h-full w-full object-cover" /> : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-black text-slate-950">{formatZAR(item.prizeValueZAR)}</div>
          <div className={`rounded-full px-3 py-1 text-xs font-bold ${badgeTone}`}>{isClosed ? "Closed" : isActivated ? "Activated" : "Open"}</div>
        </div>

        <h3 className="mt-3 text-lg font-black text-slate-950">{item.title}</h3>

        <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
          {game ? <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-800">{game}</span> : null}
          {typeof item.playCostCredits === "number" ? <span className="rounded-full bg-slate-100 px-3 py-1">{item.playCostCredits} credits/play</span> : null}
          {hot ? <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">Hot</span> : null}
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Activation</span>
            <span>{progressText}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ItemCard;
