// src/components/BuyNowButton.tsx
"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type BuyQuote = {
  ok: boolean;
  error?: string;
  priceCredits?: number;
  discountCredits?: number;
  voucherCredits?: number; // backwards compat
  amountDueCredits?: number;
  payCredits?: number;
  outstandingPaidNeeded?: number;
  balances?: { paid: number; free: number; total: number };
};

function formatZAR(v: number) {
  return `R${Number(v || 0).toLocaleString("en-ZA")}`;
}

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

  const resolvedItemId = useMemo(
    () => itemId || params?.id || params?.itemId || params?.ItemId,
    [itemId, params]
  );

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [quote, setQuote] = useState<BuyQuote | null>(null);
  const [show, setShow] = useState(false);

  async function fetchQuote(): Promise<BuyQuote> {
    const res = await fetch(`/api/item/${resolvedItemId}/buy`, {
      method: "GET",
      cache: "no-store",
    });
    const data = (await res.json().catch(() => null)) as BuyQuote | null;
    if (!res.ok || !data?.ok) {
      return { ok: false, error: (data as any)?.error || "Could not get buy quote" };
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
      const q = await fetchQuote();
      if (!q.ok) {
        setMsg(q.error || "Could not get buy quote");
        setShow(false);
        return;
      }
      setQuote(q);
      setShow(true);
    } catch (e: any) {
      setMsg(e?.message || "Could not get buy quote");
      setShow(false);
    } finally {
      setBusy(false);
    }
  }

  const price = Number(quote?.priceCredits ?? 0);
  const discount = Number(quote?.discountCredits ?? quote?.voucherCredits ?? 0);
  const due = Number(quote?.amountDueCredits ?? quote?.payCredits ?? 0);
  const paidBal = Number(quote?.balances?.paid ?? 0);

  const usePaid = Math.min(paidBal, due);
  const topUp = Math.max(0, due - usePaid);

  async function complete(mode: "full" | "mix") {
    if (!resolvedItemId) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/item/${resolvedItemId}/buy`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data: any = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setMsg((data?.error || "Could not complete purchase") as string);
        return;
      }
      window.dispatchEvent(new Event("pwnit:credits"));
      router.refresh();
      setMsg("Purchased successfully.");
      setShow(false);
    } catch (e: any) {
      setMsg(e?.message || "Could not complete purchase");
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
        {children ?? (busy ? "Loading…" : "Buy Now")}
      </button>

      {show && quote?.ok ? (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-800">
          <div className="font-extrabold text-slate-900">Buy Now</div>

          <div className="mt-2 grid grid-cols-1 gap-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Price</span>
              <span className="font-semibold">{formatZAR(price)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Discount (50% of paid credits used)</span>
              <span className="font-semibold">{formatZAR(discount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Amount due</span>
              <span className="font-extrabold">{formatZAR(due)}</span>
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Link
              href={`/pay?itemId=${encodeURIComponent(String(resolvedItemId))}&mode=full`}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm font-extrabold text-slate-900 hover:bg-slate-50"
            >
              Pay {formatZAR(due)} now
            </Link>

            <Link
              href={`/pay?itemId=${encodeURIComponent(String(resolvedItemId))}&mode=mix`}
              className="rounded-xl bg-slate-900 px-3 py-2 text-center text-sm font-extrabold text-white hover:bg-slate-800"
            >
              Use credits {formatZAR(usePaid)} + top up {formatZAR(topUp)}
            </Link>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
              disabled={busy}
              onClick={() => complete("full")}
              title="MVP shortcut: simulate paying the full amount"
            >
              Simulate pay full
            </button>
            <button
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
              disabled={busy}
              onClick={() => complete("mix")}
              title="MVP shortcut: simulate paying with credits + top-up"
            >
              Simulate mix
            </button>
          </div>
        </div>
      ) : null}

      {msg ? <div className="mt-2 text-xs font-semibold text-slate-700">{msg}</div> : null}
    </div>
  );
}

export default BuyNowButton;
