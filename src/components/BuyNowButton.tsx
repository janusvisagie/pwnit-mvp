"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Quote = {
  priceCredits: number;
  spentCredits: number;
  discountAppliedCredits: number;
  amountDueCredits: number;
  walletAppliedCredits: number;
  topUpCredits: number;
  paidBalance: number;
};

function formatZAR(v: number) {
  return `R${Number(v || 0).toLocaleString("en-ZA")}`;
}

export function BuyNowButton({
  itemId,
  className,
  children,
}: {
  itemId: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadQuote() {
    if (!itemId) {
      setMsg("Missing itemId");
      return;
    }

    setBusy(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/item/${itemId}/buy`, { method: "GET", cache: "no-store" });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setMsg(data?.error || "Could not load buy options");
        return;
      }

      setQuote({
        priceCredits: Number(data.priceCredits || 0),
        spentCredits: Number(data.spentCredits || 0),
        discountAppliedCredits: Number(data.discountAppliedCredits || 0),
        amountDueCredits: Number(data.amountDueCredits || 0),
        walletAppliedCredits: Number(data.walletAppliedCredits || 0),
        topUpCredits: Number(data.topUpCredits || 0),
        paidBalance: Number(data?.balances?.paid ?? 0),
      });
    } catch (e: any) {
      setMsg(e?.message || "Could not load buy options");
    } finally {
      setBusy(false);
    }
  }

  async function purchase(mode: "full" | "mix") {
    if (!itemId) {
      setMsg("Missing itemId");
      return;
    }

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
        setMsg(data?.error || "Could not complete purchase");
        return;
      }

      if (mode === "full") {
        setMsg(`Purchase recorded. Pay ${formatZAR(data.topUpCredits ?? data.amountDueCredits)} directly.`);
      } else {
        setMsg(`Purchase recorded. Applied ${formatZAR(data.walletAppliedCredits)} from your wallet and pay ${formatZAR(data.topUpCredits)}.`);
      }
      setQuote(null);
      window.dispatchEvent(new Event("pwnit:credits"));
      router.refresh();
    } catch (e: any) {
      setMsg(e?.message || "Could not complete purchase");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={loadQuote}
        disabled={busy}
        className={
          className ??
          [
            "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-extrabold",
            busy ? "bg-slate-200 text-slate-500" : "bg-slate-900 text-white hover:bg-slate-800",
          ].join(" ")
        }
      >
        {children ?? (busy ? "Loading…" : "Buy now")}
      </button>

      {quote ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              Price: <span className="font-extrabold text-slate-900">{formatZAR(quote.priceCredits)}</span>
            </div>
            <div>
              Your play discount: <span className="font-extrabold text-slate-900">{formatZAR(quote.discountAppliedCredits)}</span>
            </div>
            <div>
              New price: <span className="font-extrabold text-slate-900">{formatZAR(quote.amountDueCredits)}</span>
            </div>
            <div>
              Paid credits in wallet: <span className="font-extrabold text-slate-900">{formatZAR(quote.paidBalance)}</span>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => purchase("full")}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-500"
            >
              Pay {formatZAR(quote.amountDueCredits)} now
            </button>
            <button
              type="button"
              disabled={busy || quote.walletAppliedCredits <= 0}
              onClick={() => purchase("mix")}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-900 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400"
            >
              {quote.walletAppliedCredits > 0
                ? `Use ${formatZAR(quote.walletAppliedCredits)} wallet credits + pay ${formatZAR(quote.topUpCredits)}`
                : "No paid wallet credits available yet"}
            </button>
          </div>
        </div>
      ) : null}

      {msg ? <div className="text-xs font-semibold text-slate-700">{msg}</div> : null}
    </div>
  );
}

export default BuyNowButton;
