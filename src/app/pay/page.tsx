"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

function formatZAR(v: number) {
  return `R${Number(v || 0).toLocaleString("en-ZA")}`;
}

type Quote = {
  priceCredits?: number;
  discountCredits?: number;
  voucherCredits?: number;
  amountDueCredits?: number;
  payCredits?: number;
  balances?: {
    paid?: number;
  };
};

function PayPageInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const itemId = sp.get("itemId") || "";
  const mode = (sp.get("mode") || "mix").toLowerCase();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);

  const title = useMemo(
    () => (mode === "full" ? "Pay full amount" : "Use credits + top up"),
    [mode],
  );

  async function loadQuote() {
    if (!itemId) {
      setMsg("Missing itemId");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/item/${itemId}/buy`, { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setMsg(data?.error || "Could not load quote");
        return;
      }
      setQuote(data as Quote);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Could not load quote");
    } finally {
      setBusy(false);
    }
  }

  async function complete() {
    if (!itemId) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/item/${itemId}/buy`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setMsg(data?.error || "Payment failed (MVP)");
        return;
      }
      window.dispatchEvent(new Event("pwnit:credits"));
      setMsg("Payment successful. Item purchased.");
      router.refresh();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Payment failed (MVP)");
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

  return (
    <main className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{title}</h1>

      {!quote ? (
        <button
          className="rounded-md bg-cyan-600 px-4 py-2 text-white disabled:opacity-60"
          onClick={loadQuote}
          disabled={busy}
        >
          {busy ? "Loading…" : "Load payment details"}
        </button>
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <span>Price</span>
              <span className="font-medium">{formatZAR(price)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Discount</span>
              <span className="font-medium">{formatZAR(discount)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-2">
              <span>Amount due</span>
              <span className="font-semibold">{formatZAR(due)}</span>
            </div>
            {mode === "mix" ? (
              <>
                <div className="flex items-center justify-between gap-4">
                  <span>Use paid credits</span>
                  <span className="font-medium">{formatZAR(usePaid)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Top up required</span>
                  <span className="font-medium">{formatZAR(topUp)}</span>
                </div>
              </>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-md bg-cyan-600 px-4 py-2 text-white disabled:opacity-60"
              onClick={complete}
              disabled={busy}
            >
              {busy ? "Processing…" : "Complete payment (MVP)"}
            </button>
            <Link className="rounded-md border border-slate-300 px-4 py-2" href="/">
              Cancel
            </Link>
          </div>
        </>
      )}

      {msg ? <p className="rounded-md bg-slate-100 p-3 text-sm text-slate-700">{msg}</p> : null}

      <p className="text-sm text-slate-500">
        Payments are still MVP placeholder — this page simulates a payment flow.
      </p>
    </main>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-xl p-6">Loading payment page…</main>}>
      <PayPageInner />
    </Suspense>
  );
}
