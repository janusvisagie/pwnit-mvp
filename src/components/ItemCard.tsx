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
    ? "bg-slate-950 text-white shadow-slate-950/20"
    : isActivated
      ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
      : "bg-white/95 text-slate-800 ring-1 ring-slate-200";

  const statusText = isClosed ? "Won" : isActivated ? "Activated" : "Open";

  return (
    <Link
      href={href}
      className="group relative flex h-full min-h-[285px] flex-col overflow-hidden rounded-[28px] border border-slate-200/90 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(15,23,42,0.14)]"
    >
      {isClosed ? (
        <div className="pointer-events-none absolute left-[-22%] top-[46%] z-30 w-[150%] -translate-y-1/2 -rotate-12 bg-slate-950/96 px-4 py-2.5 text-center text-[10px] font-extrabold tracking-[0.18em] text-white shadow-xl sm:text-xs">
          PRIZE WON • NEXT PRIZE LOADING
        </div>
      ) : null}

      <div className="relative flex min-h-[170px] items-center justify-center overflow-hidden px-5 py-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.12),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)]" />
        <div className="absolute -left-8 top-6 h-24 w-24 rounded-full bg-cyan-300/25 blur-2xl" />
        <div className="absolute -right-6 bottom-4 h-24 w-24 rounded-full bg-fuchsia-300/20 blur-2xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-slate-200/80" />

        <ProductImage
          primarySrc={primaryImage}
          fallbackSrc={fallbackImage}
          alt={item.title}
          className="relative z-10 flex items-center justify-center"
          imgClassName="max-h-[118px] max-w-full object-contain transition duration-300 group-hover:scale-[1.04] sm:max-h-[128px]"
        />

        <div className="absolute left-4 top-4 z-20 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-extrabold text-slate-900 shadow-sm ring-1 ring-slate-200">
          {formatZAR(item.prizeValueZAR)}
        </div>

        <div className={`absolute right-4 top-4 z-20 rounded-full px-3 py-1.5 text-[11px] font-extrabold shadow-sm ${statusTone}`}>
          {statusText}
        </div>

        {hot ? (
          <div className="animate-pwnit-pulse-soft absolute bottom-4 left-4 z-20 rounded-full bg-amber-300 px-3 py-1.5 text-[11px] font-extrabold text-slate-900 shadow-sm">
            Hot
          </div>
        ) : null}

        {isActivated && item.closesAt ? (
          <div className="absolute bottom-4 right-4 z-20">
            <CountdownChip state={item.state} closesAt={item.closesAt} />
          </div>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between gap-3 p-4">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-[18px] font-black leading-tight tracking-tight text-slate-900">
            {item.title}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] leading-tight text-slate-600">
            {gLabel ? (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700">
                {gLabel}
              </span>
            ) : null}

            {typeof item.playCostCredits === "number" ? (
              <span className="rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-1 font-semibold text-cyan-800">
                {item.playCostCredits} credits / play
              </span>
            ) : null}
          </div>
        </div>

        {!isClosed ? (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 text-[12px] font-semibold text-slate-600">
              <span className="truncate">Activation progress</span>
              <span className="shrink-0 text-slate-900">{isActivated ? "Activated" : activationStageLabel(pct)}</span>
            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#06b6d4_0%,#3b82f6_55%,#8b5cf6_100%)] transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="text-[12px] text-slate-500">Climb the leaderboard to claim this prize.</div>
              <div className="shrink-0 rounded-full bg-slate-950 px-3 py-1.5 text-[12px] font-extrabold text-white transition group-hover:bg-slate-800">
                Play now
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="text-[12px] text-slate-500">View results or buy the prize if you didn’t win.</div>
            <div className="inline-flex w-fit rounded-full bg-slate-950 px-3 py-1.5 text-[12px] font-extrabold text-white">
              View results
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

export default ItemCard;
