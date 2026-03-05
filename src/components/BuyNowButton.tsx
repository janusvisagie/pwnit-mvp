// src/components/BuyNowButton.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

type BuyQuote = {
  ok: boolean;
  error?: string;
  priceCredits?: number;
  voucherCredits?: number;
  amountDueCredits?: number;
  payCredits?: number;
  outstandingPaidNeeded?: number;
  balances?: { paid: number; free: number; total: number };
};

export function BuyNowButton({
  itemId,
  className,
  children,
}: {
  itemId?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const params = useParams() as any;

  const resolvedItemId = itemId || params?.id || params?.itemId || params?.ItemId;

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function fetchQuote(): Promise<BuyQuote> {
    const res = await fetch(`/api/item/${resolvedItemId}/buy`, { method: "GET" });
    const data = (await res.json().catch(() => null)) as BuyQuote | null;
    if (!res.ok || !data?.ok) {
      return {
        ok: false,
        error: (data as any)?.error || "Could not get buy quote",
      };
    }
    return data as BuyQuote;
  }

  async function onBuy() {
    if (!resolvedItemId) {
      setMsg("Missing itemId");
      return;
    }

    setBusy(true);
    setMsg(null);

    try {
      const quote = await fetchQuote();
      if (!quote.ok) {
        setMsg(quote.error || "Could not buy");
        return;
      }

      const price = Number(quote.priceCredits ?? 0);
      const voucher = Number(quote.voucherCredits ?? 0);
      const due = Number(quote.amountDueCredits ?? quote.payCredits ?? 0);
      const paidBal = Number(quote.balances?.paid ?? 0);
      const outstanding = Math.max(0, due - paidBal);

      const explain = `Price: ${price} • Voucher: ${voucher} • Amount due: ${due}`;

      if (outstanding > 0) {
        setMsg(`${explain}. You need ${outstanding} more paid credits.`);
        return;
      }

      const ok = window.confirm(`${explain}. Proceed with purchase?`);
      if (!ok) return;

      const res = await fetch(`/api/item/${resolvedItemId}/buy`, { method: "POST" });
      const data: any = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        // If server returns helpful numbers, show them.
        const p = Number(data?.priceCredits ?? price);
        const v = Number(data?.voucherCredits ?? voucher);
        const d = Number(data?.payCredits ?? data?.amountDueCredits ?? due);
        const need = Number(data?.outstandingPaidNeeded ?? Math.max(0, d - paidBal));
        const extra = need > 0 ? ` You need ${need} more paid credits.` : "";
        setMsg((data?.error || "Could not buy") + ". " + `Price: ${p} • Voucher: ${v} • Amount due: ${d}.` + extra);
        return;
      }

      setMsg(`Purchased! Paid ${data.payCredits} credits. New paid balance: ${data.newBalance}.`);
      router.refresh();
      window.dispatchEvent(new Event("pwnit:credits"));
    } catch (e: any) {
      setMsg(e?.message || "Could not buy");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <button
        onClick={onBuy}
        disabled={busy}
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {children ?? (busy ? "Buying…" : "Buy Now")}
      </button>

      {msg ? <div className="mt-2 text-xs font-semibold text-slate-700">{msg}</div> : null}
    </div>
  );
}

export default BuyNowButton;
