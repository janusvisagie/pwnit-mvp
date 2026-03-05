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
        <div className="text-sm font-semibold text-slate-900">You won — no need to buy.</div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-extrabold text-slate-900">Buy it now (anytime)</div>

      <div className="mt-1 text-xs text-slate-600">
        The amount due is: <span className="font-semibold">Item price</span> minus <span className="font-semibold">50% of the paid credits</span> you already spent playing.
        {isSettled ? "" : " Results will still publish as normal when the countdown ends."}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <BuyNowButton itemId={itemId} />

        <Link className="text-sm font-semibold text-slate-900 hover:underline" href="/buy-credits">
          Buy credits
        </Link>

        <Link className="text-sm font-semibold text-slate-900 hover:underline" href="/how-activation-works">
          How it works
        </Link>
      </div>
    </section>
  );
}
