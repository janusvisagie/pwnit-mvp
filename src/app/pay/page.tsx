// src/app/pay/page.tsx
"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function formatZAR(v: number) {
  return `R${Number(v || 0).toLocaleString("en-ZA")}`;
}

export default function PayPage() {
  const sp = useSearchParams();
  const router = useRouter();

  const itemId = sp.get("itemId") || "";
  const mode = (sp.get("mode") || "mix").toLowerCase();

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [quote, setQuote] = useState<any>(null);

  const title = useMemo(() => (mode === "full" ? "Pay full amount" : "Use credits + top up"), [mode]);

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
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        {!quote ? (
          <button
            onClick={loadQuote}
            disabled={busy}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {busy ? "Loading…" : "Load payment details"}
          </button>
        ) : (
          <>
            <div className="grid gap-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Price</span>
                <span className="font-semibold">{formatZAR(price)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Discount</span>
                <span className="font-semibold">{formatZAR(discount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Amount due</span>
                <span className="font-extrabold">{formatZAR(due)}</span>
              </div>

              {mode === "mix" ? (
                <>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-slate-600">Use paid credits</span>
                    <span className="font-semibold">{formatZAR(usePaid)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Top up required</span>
                    <span className="font-extrabold">{formatZAR(topUp)}</span>
                  </div>
                </>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={complete}
                disabled={busy}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {busy ? "Processing…" : "Complete payment (MVP)"}
              </button>

              <Link
                href={itemId ? `/item/${itemId}` : "/"}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Cancel
              </Link>
            </div>
          </>
        )}

        {msg ? <div className="mt-3 text-sm font-semibold text-slate-700">{msg}</div> : null}
      </section>

      <p className="text-xs text-slate-500">
        Payments are still MVP placeholder — this page simulates a payment flow.
      </p>
    </main>
  );
}
