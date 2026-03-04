// src/app/buy-credits/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react";

const BUNDLES = [
  { credits: 10, price: "R10" },
  { credits: 25, price: "R25" },
  { credits: 50, price: "R50" },
  { credits: 100, price: "R100" },
];

export default function BuyCreditsPage() {
  const [loading, setLoading] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function buy(credits: number) {
    setLoading(credits);
    setMsg(null);
    try {
      const res = await fetch("/api/credits/buy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ exactCredits: credits }),
      });
      const data: any = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        setMsg(data?.error || "Could not add credits.");
        return;
      }

      setMsg(`Added ${credits} credits. Your balance is now ${data?.totalCredits ?? "updated"}.`);
      // simplest update for MVP
      window.location.href = "/";
    } catch {
      setMsg("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Buy credits</h1>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold text-slate-900">Bundles</div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {BUNDLES.map((b) => (
            <button
              key={b.credits}
              className="rounded-2xl border border-slate-200 bg-white p-3 text-left hover:bg-slate-50 disabled:opacity-60"
              disabled={loading !== null}
              onClick={() => buy(b.credits)}
            >
              <div className="text-lg font-extrabold text-slate-900">{b.credits}</div>
              <div className="text-xs font-semibold text-slate-600">{b.price}</div>
              <div className="mt-1 text-[11px] text-slate-500">
                {loading === b.credits ? "Adding…" : "Add credits"}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 text-xs text-slate-600">
          MVP note: payments are placeholder. This simulates adding credits to the current demo user.
        </div>

        {msg ? <div className="mt-3 text-sm font-semibold text-slate-900">{msg}</div> : null}

        <div className="mt-3">
          <Link className="text-sm font-semibold text-slate-900 hover:underline" href="/">
            ← Back to Home
          </Link>
        </div>
      </section>
    </div>
  );
}
