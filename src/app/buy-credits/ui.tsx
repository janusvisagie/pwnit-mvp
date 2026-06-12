// src/app/buy-credits/ui.tsx
"use client";

import { useState } from "react";

const BUNDLES = [
  { key: "starter", credits: 30, blurb: "6 extra plays" },
  { key: "value", credits: 80, blurb: "16 extra plays" },
  { key: "max", credits: 150, blurb: "30 extra plays" },
] as const;

export function BuyCreditsBundles() {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function buy(bundleKey: string, credits: number) {
    setLoading(bundleKey);
    setMessage(null);
    setIsError(false);
    try {
      const res = await fetch("/api/credits/buy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bundleKey }),
      });
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        setIsError(true);
        setMessage(data?.error || "Could not add credits. Please try again.");
        return;
      }
      setMessage(`Added R${data?.added ?? credits} in credits. New balance: R${data?.totalCredits ?? "-"}.`);
      // Nudge the header pill (it listens for this) so the balance updates without a reload.
      window.dispatchEvent(new Event("pwnit:credits"));
    } catch {
      setIsError(true);
      setMessage("Could not add credits. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {BUNDLES.map((b) => (
          <button
            key={b.key}
            onClick={() => buy(b.key, b.credits)}
            disabled={loading !== null}
            className="rounded-2xl border border-[#ecd8d0] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 disabled:opacity-60"
          >
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{b.blurb}</p>
            <p className="mt-2 text-2xl font-black text-slate-950">R{b.credits}</p>
            <p className="mt-2 inline-flex rounded-full bg-[#0f172a] px-4 py-2 text-xs font-black text-white">
              {loading === b.key ? "Adding…" : `Buy R${b.credits} credits`}
            </p>
          </button>
        ))}
      </div>
      {message ? (
        <p className={`text-sm font-bold ${isError ? "text-red-600" : "text-emerald-700"}`}>{message}</p>
      ) : null}
      <p className="text-xs font-semibold text-slate-500">
        Test mode: no real payment is taken yet. 1 credit = R1; every R1 of paid play becomes R1 of discount.
      </p>
    </div>
  );
}

// Back-compat alias for any older import.
export const BuyCreditsButton = BuyCreditsBundles;
