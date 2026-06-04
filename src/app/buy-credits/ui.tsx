"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// 1 credit = R1 (ZAR_PER_CREDIT). Bundle keys must match /api/credits/buy.
const BUNDLES: { key: string; credits: number; label: string; highlight?: boolean }[] = [
  { key: "starter", credits: 30, label: "Starter" },
  { key: "value", credits: 80, label: "Value", highlight: true },
  { key: "max", credits: 150, label: "Max" },
];

type Balance = { free: number; paid: number };

export function BuyCreditsPanel() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadBalance() {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      const free = Number(data?.freeCreditsBalance ?? data?.user?.freeCreditsBalance ?? 0);
      const paid = Number(data?.paidCreditsBalance ?? data?.user?.paidCreditsBalance ?? 0);
      setBalance({ free, paid });
    } catch {
      // non-fatal
    }
  }

  useEffect(() => {
    loadBalance();
  }, []);

  async function buy(bundleKey: string) {
    setPending(bundleKey);
    setError(null);
    try {
      const res = await fetch("/api/credits/buy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bundleKey }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setError(data?.error || "Could not add credits.");
        return;
      }
      setBalance({
        free: Number(data.freeCreditsBalance ?? 0),
        paid: Number(data.paidCreditsBalance ?? 0),
      });
    } catch (e: any) {
      setError(e?.message || "Could not add credits.");
    } finally {
      setPending(null);
    }
  }

  const total = balance ? balance.free + balance.paid : null;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total credits" value={total === null ? "—" : `R${total}`} />
        <Stat label="Free credits" value={balance === null ? "—" : `R${balance.free}`} />
        <Stat label="Paid credits" value={balance === null ? "—" : `R${balance.paid}`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {BUNDLES.map((b) => (
          <div
            key={b.key}
            className={[
              "flex flex-col rounded-2xl border bg-white p-5 shadow-sm",
              b.highlight ? "border-emerald-500 ring-1 ring-emerald-200" : "border-[#e6ded9]",
            ].join(" ")}
          >
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{b.label}</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{b.credits}</p>
            <p className="text-sm font-semibold text-slate-600">credits · R{b.credits}</p>
            <button
              onClick={() => buy(b.key)}
              disabled={pending !== null}
              className={[
                "mt-4 inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-black transition",
                pending === b.key
                  ? "bg-slate-200 text-slate-500"
                  : "bg-emerald-600 text-white hover:-translate-y-0.5 hover:bg-emerald-700",
              ].join(" ")}
            >
              {pending === b.key ? "Adding…" : `Add ${b.credits}`}
            </button>
          </div>
        ))}
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/"
          className="rounded-full bg-[#0f172a] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#172554]"
        >
          Back to campaign
        </Link>
        <Link
          href="/play/pwnit-2"
          className="rounded-full border border-emerald-300 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-800 transition hover:-translate-y-0.5 hover:bg-white"
        >
          Play game
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#e6ded9] bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}
