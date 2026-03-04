// src/app/item/[id]/_components/BuyIfDidntWinPanel.tsx
"use client";

import Link from "next/link";
import { BuyNowButton } from "@/components/BuyNowButton";

export default function BuyIfDidntWinPanel({
  itemId,
  meWon,
  isSettled,
}: {
  itemId: string;
  meWon: boolean;
  isSettled: boolean;
}) {
  if (meWon) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold text-slate-900">🎉 You won — no need to buy.</div>
      </section>
    );
  }

  if (!isSettled) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-extrabold text-slate-900">Buy if you didn’t win</div>
        <div className="mt-1 text-xs text-slate-600">
          This option unlocks once the countdown ends and results are published (so we can confirm you didn’t win).
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl bg-slate-200 px-4 py-2 text-sm font-extrabold text-slate-500 cursor-not-allowed"
            disabled
            title="Locked until results are published"
          >
            Buy now (locked)
          </button>

          <Link className="text-sm font-semibold text-slate-900 hover:underline" href="/how-activation-works">
            How it works
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-extrabold text-slate-900">Didn’t win? You can still buy it.</div>
      <div className="mt-1 text-xs text-slate-600">
        This will charge the difference based on your tier + what you already spent playing.
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <BuyNowButton itemId={itemId} />
        <Link className="text-sm font-semibold text-slate-900 hover:underline" href="/buy-credits">
          Buy credits
        </Link>
      </div>
    </section>
  );
}
