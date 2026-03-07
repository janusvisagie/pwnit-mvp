"use client";

import Link from "next/link";
import { useState } from "react";

const BUNDLES = [
  { key: "starter", credits: 60, price: 50, label: "Starter" },
  { key: "player", credits: 130, price: 100, label: "Player" },
  { key: "pro", credits: 350, price: 250, label: "Pro" },
  { key: "elite", credits: 750, price: 500, label: "Elite" },
];

function formatZAR(v: number) {
  return `R${Number(v || 0).toLocaleString("en-ZA")}`;
}

export default function BuyCreditsPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function buy(bundleKey: string) {
    setLoading(bundleKey);
    setMsg(null);
    try {
      const res = await fetch("/api/credits/buy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bundleKey }),
      });
      const data: any = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        setMsg(data?.error || "Could not add credits.");
        return;
      }

      setMsg(`Added ${data?.added ?? 0} credits. Your balance is now ${data?.totalCredits ?? "updated"}.`);
      window.dispatchEvent(new Event("pwnit:credits"));
      window.location.href = "/";
    } catch {
      setMsg("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Buy credits</h1>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold text-slate-900">Credit packs</div>
        <div className="mt-1 text-sm text-slate-600">Bigger packs include bonus credits.</div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {BUNDLES.map((b) => (
            <button
              key={b.key}
              className="rounded-2xl border border-slate-200 bg-white p-3 text-left hover:bg-slate-50 disabled:opacity-60"
              disabled={loading !== null}
              onClick={() => buy(b.key)}
            >
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{b.label}</div>
              <div className="mt-1 text-2xl font-extrabold text-slate-900">{b.credits}</div>
              <div className="text-sm font-semibold text-slate-600">{formatZAR(b.price)}</div>
              <div className="mt-2 text-[11px] text-emerald-700">{b.credits - b.price} bonus credits</div>
              <div className="mt-1 text-[11px] text-slate-500">{loading === b.key ? "Adding…" : "Add credits"}</div>
            </button>
          ))}
        </div>

        <div className="mt-4 text-xs text-slate-600">MVP note: payments are placeholder. This simulates adding credits to the current demo user.</div>

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
