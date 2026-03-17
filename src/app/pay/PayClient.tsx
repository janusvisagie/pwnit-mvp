"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function formatZAR(v: number) {
  return `R${Number(v || 0).toLocaleString("en-ZA")}`;
}

type Quote = {
  priceCredits?: number;
  playDiscountCredits?: number;
  discountCredits?: number;
  newPriceCredits?: number;
  amountDueCredits?: number;
  payCredits?: number;
  balances?: {
    paid?: number;
    free?: number;
  };
};

type Me = {
  isGuest: boolean;
  actorLabel: string;
};

export default function PayClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const itemId = searchParams.get("itemId") || "";
  const mode = (searchParams.get("mode") || "mix").toLowerCase();

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [me, setMe] = useState<Me | null>(null);

  const title = useMemo(() => (mode === "full" ? "Pay full amount" : "Use credits + top up"), [mode]);
  const loginHref = useMemo(() => {
    const raw = `/pay?itemId=${encodeURIComponent(itemId)}&mode=${encodeURIComponent(mode)}`;
    return `/login?next=${encodeURIComponent(raw)}`;
  }, [itemId, mode]);

  useEffect(() => {
    async function loadMe() {
      const response = await fetch("/api/me", { cache: "no-store" });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) return;
      setMe({ isGuest: Boolean(data.isGuest), actorLabel: String(data.actorLabel || "") });
    }

    void loadMe();
  }, []);

  async function loadQuote() {
    if (!itemId) {
      setMessage("Missing itemId");
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/item/${itemId}/buy`, { cache: "no-store" });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        setMessage(data?.error || "Could not load quote");
        return;
      }
      setQuote(data);
    } catch (error: any) {
      setMessage(error?.message || "Could not load quote");
    } finally {
      setBusy(false);
    }
  }

  async function complete() {
    if (!itemId) return;

    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/item/${itemId}/buy`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        setMessage(data?.error || "Payment failed (MVP)");
        return;
      }

      window.dispatchEvent(new Event("pwnit:credits"));
      setMessage("Payment successful. Item purchased.");
      router.refresh();
    } catch (error: any) {
      setMessage(error?.message || "Payment failed (MVP)");
    } finally {
      setBusy(false);
    }
  }

  const price = Number(quote?.priceCredits ?? 0);
  const discount = Number(quote?.playDiscountCredits ?? quote?.discountCredits ?? 0);
  const due = Number(quote?.newPriceCredits ?? quote?.amountDueCredits ?? quote?.payCredits ?? 0);
  const paidBal = Number(quote?.balances?.paid ?? 0);
  const usePaid = Math.min(paidBal, due);
  const topUp = Math.max(0, due - usePaid);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-slate-900">{title}</h1>
        {me ? <p className="text-sm text-slate-600">Current player: {me.actorLabel}</p> : null}
      </div>

      {me?.isGuest ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-semibold">You need to sign in before buying an item.</p>
          <p className="mt-1">Guest play stays frictionless, but checkout is account-only.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={loginHref}
              className="rounded-full bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              Sign in to continue
            </Link>
            <Link
              href="/"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </div>
      ) : !quote ? (
        <button
          type="button"
          onClick={loadQuote}
          disabled={busy}
          className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Loading…" : "Load payment details"}
        </button>
      ) : (
        <>
          <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm sm:grid-cols-2">
            <div>
              <div className="text-slate-500">Price</div>
              <div className="text-lg font-black text-slate-900">{formatZAR(price)}</div>
            </div>
            <div>
              <div className="text-slate-500">Discount</div>
              <div className="text-lg font-black text-slate-900">{formatZAR(discount)}</div>
            </div>
            <div>
              <div className="text-slate-500">Amount due</div>
              <div className="text-lg font-black text-slate-900">{formatZAR(due)}</div>
            </div>
            {mode === "mix" ? (
              <>
                <div>
                  <div className="text-slate-500">Use paid credits</div>
                  <div className="text-lg font-black text-slate-900">{formatZAR(usePaid)}</div>
                </div>
                <div>
                  <div className="text-slate-500">Top up required</div>
                  <div className="text-lg font-black text-slate-900">{formatZAR(topUp)}</div>
                </div>
              </>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={complete}
              disabled={busy}
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Processing…" : "Complete payment (MVP)"}
            </button>
            <Link
              href="/"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </>
      )}

      {message ? <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</div> : null}

      <p className="text-xs text-slate-500">Payments are still MVP placeholder — this page simulates a payment flow.</p>
    </div>
  );
}
