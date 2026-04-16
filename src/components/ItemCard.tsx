"use client";

import Link from "next/link";
import { useMemo } from "react";

import { activationStageLabel } from "@/lib/playCost";
import { getGameLabel } from "@/lib/gameRules";
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
  playerActivityPct?: number;
  verifiedSubscriberPct?: number;
  playerActivityCredits?: number;
  verifiedSubscriberCredits?: number;
  activationCurrent?: number;
  activationTarget?: number;
};

function formatZAR(v: number) {
  return `R${Number(v || 0).toLocaleString("en-ZA")}`;
}

function displayGameLabel(item: ItemCardModel) {
  if (item.title === "Checkers Voucher" && item.gameKey === "clue-ladder") return "Number Chain";
  return item.gameKey ? getGameLabel(item.gameKey) : null;
}

export function ItemCard({ item }: { item: ItemCardModel }) {
  const pct = Math.max(0, Math.min(100, Number(item.activationPct ?? 0)));
  const playerPct = Math.max(0, Math.min(100, Number(item.playerActivityPct ?? 0)));
  const subscriberPct = Math.max(0, Math.min(100, Number(item.verifiedSubscriberPct ?? 0)));
  const normalizedState = String(item.state || "").toUpperCase();
  const isActivated = normalizedState === "ACTIVATED";
  const isPlayable = normalizedState === "OPEN" || normalizedState === "BUILDING" || normalizedState === "ACTIVATED";
  const isClosed = !isPlayable;
  const href = isClosed ? `/item/${item.id}/leaderboard` : `/item/${item.id}`;
  const product = getProductContent(item.title, item.imageUrl);
  const fallbackImage = getFallbackProductImage(item.title, item.imageUrl);
  const primaryImage = product?.imageUrl ?? item.imageUrl ?? fallbackImage ?? "";
  const game = displayGameLabel(item);
  const hot = useMemo(() => isPlayable && !isActivated && pct >= 75, [isPlayable, isActivated, pct]);
  const progressText = isActivated ? "Activated" : activationStageLabel(pct);
  const helperText = isActivated
    ? "Countdown is running now."
    : `Player activity ${item.playerActivityCredits ?? 0} • verified subscribers ${item.verifiedSubscriberCredits ?? 0}`;

  return (
    <Link href={href} className="group block h-full">
      <article className="relative flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        {isClosed ? (
          <div className="absolute inset-x-0 top-5 z-20 -rotate-6 bg-slate-950 py-2 text-center text-sm font-black uppercase tracking-[0.24em] text-white shadow-lg">
            Prize won
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5">
          <div className="text-xl font-black text-slate-950 sm:text-2xl">{formatZAR(item.prizeValueZAR)}</div>
          <div className={`rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ${isClosed ? "bg-slate-900 text-white ring-slate-900" : isActivated ? "bg-emerald-100 text-emerald-800 ring-emerald-200" : "bg-slate-100 text-slate-700 ring-slate-200"}`}>
            {isClosed ? "Closed" : isActivated ? "Activated" : "Open"}
          </div>
        </div>

        <div className="px-4 pt-2 sm:px-5">
          <h3 className="text-lg font-black leading-tight text-slate-950 sm:text-xl">{item.title}</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {game ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">{game}</span> : null}
            {typeof item.playCostCredits === "number" ? <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-200">{item.playCostCredits} credits / play</span> : null}
            {hot ? <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">Hot</span> : null}
          </div>
        </div>

        <div className="px-4 pt-4 sm:px-5">
          {primaryImage ? (
            <img src={primaryImage} alt={item.title} className="h-44 w-full object-contain sm:h-48" />
          ) : (
            <div className="flex h-44 items-center justify-center rounded-3xl bg-slate-50 text-sm text-slate-500 ring-1 ring-slate-200 sm:h-48">Image coming soon</div>
          )}
        </div>

        <div className="mt-auto px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Activation progress</div>
              <div className="mt-1 text-lg font-black text-slate-950 sm:text-xl">{isActivated ? "Live now" : `${pct}%`}</div>
            </div>
            <div className="text-right text-sm text-slate-600">
              <div className="font-semibold text-slate-900">{progressText}</div>
              {!isActivated ? <div>{item.activationCurrent ?? 0} / {item.activationTarget ?? 0}</div> : null}
            </div>
          </div>

          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
            <div className="flex h-full w-full overflow-hidden rounded-full">
              <div className="h-full bg-slate-900" style={{ width: `${playerPct}%` }} />
              <div className="h-full bg-emerald-500" style={{ width: `${subscriberPct}%` }} />
            </div>
          </div>

          <div className="mt-3 text-sm leading-6 text-slate-600">{helperText}</div>
          {!isActivated ? <div className="mt-2 text-sm font-bold text-slate-900">Open prize</div> : null}
        </div>
      </article>
    </Link>
  );
}

export default ItemCard;
