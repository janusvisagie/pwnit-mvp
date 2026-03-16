"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function formatZAR(v: number) {
  return `R${Number(v || 0).toLocaleString("en-ZA")}`;
}

function PayPageInner() {
  const sp = useSearchParams();
  const router = useRouter();

  const itemId = sp.get("itemId") || "";
  const mode = (sp.get("mode") || "mix").toLowerCase();

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [quote, setQuote] = useState<any | null>(null);

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
      setQuote(data);
    } catch (e: any) {
      setMsg(e?.message || "Could not load quote");
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
    } catch (e: any) {
      setMsg(e?.message || "Payment failed (MVP)");
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
    <main className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>

      {!quote ? (
        <button
          onClick={loadQuote}
          disabled={busy}
          className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {busy ? "Loading…" : "Load payment details"}
        </button>
      ) : (
        <>
          <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Price</span>
              <strong>{formatZAR(price)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Discount</span>
              <strong>{formatZAR(discount)}</strong>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-slate-700">Amount due</span>
              <strong>{formatZAR(due)}</strong>
            </div>
            {mode === "mix" ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Use paid credits</span>
                  <strong>{formatZAR(usePaid)}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Top up required</span>
                  <strong>{formatZAR(topUp)}</strong>
                </div>
              </>
            ) : null}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={complete}
              disabled={busy}
              className="rounded-lg bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
            >
              {busy ? "Processing…" : "Complete payment (MVP)"}
            </button>
            <Link href="/" className="text-sm text-slate-600 underline underline-offset-4">
              Cancel
            </Link>
          </div>
        </>
      )}

      {msg ? <p className="mt-4 text-sm text-slate-700">{msg}</p> : null}

      <p className="mt-6 text-sm text-slate-500">
        Payments are still MVP placeholder — this page simulates a payment flow.
      </p>
    </main>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-xl px-4 py-8">Loading payment page…</main>}>
      <PayPageInner />
    </Suspense>
  );
}
