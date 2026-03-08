"use client";

import Link from "next/link";
import { useState } from "react";
import { CountdownChip } from "@/components/CountdownChip";
import { getProductContent } from "@/lib/productCatalog";
import { getGameMeta } from "@/lib/gameRules";

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
  isHot?: boolean;
};

function formatZAR(v: number) {
  return `R${Number(v || 0).toLocaleString("en-ZA")}`;
}

export function ItemCard({ item }: { item: ItemCardModel }) {
  const [imgOk, setImgOk] = useState(true);
  const pct = Math.max(0, Math.min(100, Number(item.activationPct ?? 0)));
  const isClosed = ["CLOSED", "PUBLISHED", "FAILED", "REFUNDED"].includes(item.state);
  const isActivated = item.state === "ACTIVATED";
  const href = item.state === "PUBLISHED" ? `/item/${item.id}/leaderboard` : `/item/${item.id}`;
  const gMeta = getGameMeta(item.gameKey);
  const displayImage = getProductContent(item.title, item.imageUrl)?.imageUrl ?? item.imageUrl;
  const hot = Boolean(item.isHot) && !isClosed && !isActivated;

  const statusTone = isClosed
    ? "bg-slate-900 text-white"
    : isActivated
      ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
      : "bg-slate-100 text-slate-700 ring-1 ring-slate-200";

  const statusText = isClosed ? (item.state === "FAILED" || item.state === "REFUNDED" ? "Not activated" : "Closed") : isActivated ? "Activated" : item.activationLabel ?? "Building";

  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative flex h-[168px] items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 to-white p-4">
        {displayImage && imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayImage}
            alt={item.title}
            className="max-h-full max-w-full object-contain transition duration-300 group-hover:scale-[1.03]"
            onError={() => setImgOk(false)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="text-sm font-semibold text-slate-400">Image unavailable</div>
        )}

        <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-extrabold text-slate-900 shadow ring-1 ring-slate-200">
          {formatZAR(item.prizeValueZAR)}
        </div>

        <div className={`absolute right-4 top-4 rounded-full px-3 py-1 text-[11px] font-extrabold shadow-sm ${statusTone}`}>
          {statusText}
        </div>

        {hot ? (
          <div className="absolute left-4 bottom-4 rounded-full bg-amber-300 px-3 py-1 text-[11px] font-extrabold text-slate-900 shadow">
            Hot
          </div>
        ) : null}

        {isActivated && item.closesAt ? (
          <div className="absolute bottom-4 right-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-slate-800 shadow ring-1 ring-slate-200">
            Ends in <CountdownChip state={item.state} closesAt={item.closesAt} />
          </div>
        ) : null}

        {isClosed ? (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-[-24%] top-[42%] w-[150%] -rotate-12 bg-slate-900/95 px-4 py-2 text-center text-xs font-extrabold tracking-wide text-white shadow-xl">
              {item.state === "FAILED" || item.state === "REFUNDED" ? "ROUND RESETTING" : "ROUND CLOSED"}
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-extrabold text-slate-900">{item.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700 ring-1 ring-slate-200">
              {gMeta.label}
            </span>
            {typeof item.playCostCredits === "number" ? (
              <span>{item.playCostCredits} {item.playCostCredits === 1 ? "credit" : "credits"}/play</span>
            ) : null}
          </div>
        </div>

        {!isClosed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
              <span>Activation threshold</span>
              <span>{isActivated ? "Activated" : item.activationLabel ?? "Building"}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-slate-900 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            {!isActivated ? (
              <div className="text-[11px] text-slate-500">Play now to compete and help this prize go live.</div>
            ) : (
              <div className="text-[11px] text-slate-500">The countdown is on. Play now to improve your position.</div>
            )}
          </div>
        ) : (
          <div className="text-[11px] text-slate-500">View the final leaderboard, runner-up bonuses, and buy options.</div>
        )}
      </div>
    </Link>
  );
}

export default ItemCard;
