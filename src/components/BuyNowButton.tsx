"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function zar(v: number) {
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
  const [msg, setMsg] = useState<string | null>(null);
  const [quote, setQuote] = useState<any>(null);

  async function loadQuote() {
    if (!itemId) {
      setMsg("Missing itemId");
      return;
    }
    try {
      const res = await fetch(`/api/item/${itemId}/buy`, { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setQuote(null);
        setMsg(data?.error || "Could not load buy quote");
        return;
      }
      setMsg(null);
      setQuote(data);
    } catch (e: any) {
      setQuote(null);
      setMsg(e?.message || "Could not load buy quote");
    }
  }

  useEffect(() => {
    loadQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  async function onBuy() {
    if (!itemId) {
      setMsg("Missing itemId");
      return;
    }
    setBusy(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/item/${itemId}/buy`, { method: "POST" });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setMsg(data?.error || "Could not buy");
        return;
      }

      setMsg(`Purchase completed. You paid ${zar(data.payCredits)}.`);
      window.dispatchEvent(new Event("pwnit:credits"));
      router.refresh();
      loadQuote();
    } catch (e: any) {
      setMsg(e?.message || "Could not buy");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {quote ? (
        <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
          <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Item value</div>
              <div className="font-extrabold text-slate-900">{zar(quote.priceCredits)}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Your discount</div>
              <div className="font-extrabold text-slate-900">{zar(quote.discountAppliedCredits)}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">You pay</div>
              <div className="font-extrabold text-slate-900">{zar(quote.payCredits)}</div>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onBuy}
        disabled={busy || !quote}
        className={
          className ??
          [
            "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-extrabold",
            busy || !quote ? "bg-slate-200 text-slate-500" : "bg-slate-900 text-white hover:bg-slate-800",
          ].join(" ")
        }
      >
        {children ?? (busy ? "Processing…" : quote?.payCredits > 0 ? `Buy now for ${zar(quote.payCredits)}` : "Claim item")}
      </button>

      {msg ? <div className="text-xs font-semibold text-slate-700">{msg}</div> : null}
    </div>
  );
}
