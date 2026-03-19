"use client";

import { useEffect, useMemo, useState } from "react";

const BUNDLES = [
  {
    key: "starter",
    name: "Starter",
    credits: 30,
    priceLabel: "R30",
    note: "Quick top-up",
  },
  {
    key: "value",
    name: "Value",
    credits: 80,
    priceLabel: "R70",
    note: "Save R10",
  },
  {
    key: "max",
    name: "Max",
    credits: 150,
    priceLabel: "R120",
    note: "Save R30",
  },
] as const;

type Me = {
  ok?: boolean;
  isGuest?: boolean;
  isDemoUser?: boolean;
  actorLabel?: string;
  freeCreditsBalance?: number;
  paidCreditsBalance?: number;
  totalCredits?: number;
};

export default function PayClient() {
  const [me, setMe] = useState<Me | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadMe() {
    try {
      const response = await fetch("/api/me", { cache: "no-store" });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) return;
      setMe({
        ok: true,
        isGuest: Boolean(data.isGuest),
        isDemoUser: Boolean(data.isDemoUser),
        actorLabel: String(data.actorLabel || ""),
        freeCreditsBalance: Number(data.freeCreditsBalance ?? 0),
        paidCreditsBalance: Number(data.paidCreditsBalance ?? 0),
        totalCredits: Number(data.totalCredits ?? 0),
      });
    } catch {
      // Ignore background refresh failures.
    }
  }

  useEffect(() => {
    void loadMe();

    const handler = () => {
      void loadMe();
    };

    window.addEventListener("pwnit:credits", handler as EventListener);
    window.addEventListener("pwnit:userChanged", handler as EventListener);

    return () => {
      window.removeEventListener("pwnit:credits", handler as EventListener);
      window.removeEventListener("pwnit:userChanged", handler as EventListener);
    };
  }, []);

  const actorLabel = useMemo(() => me?.actorLabel || "Current player", [me?.actorLabel]);

  async function buyBundle(bundleKey: string) {
    setBusyKey(bundleKey);
    setMessage(null);

    try {
      const response = await fetch("/api/credits/buy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bundleKey }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        setMessage(data?.error || "Could not add credits.");
        return;
      }

      await loadMe();
      window.dispatchEvent(new Event("pwnit:credits"));
      setMessage(`Added ${data.added} extra credits.`);
    } catch (error: any) {
      setMessage(error?.message || "Could not add credits.");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-slate-900">Buy credits</h1>
        <p className="text-sm text-slate-600">Select a bundle and the credits are added immediately for testing.</p>
      </div>

      <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-3">
        <div>
          <div className="text-slate-500">Player</div>
          <div className="font-bold text-slate-900">{actorLabel}</div>
        </div>
        <div>
          <div className="text-slate-500">Free credits</div>
          <div className="font-bold text-slate-900">{Number(me?.freeCreditsBalance ?? 0)}</div>
        </div>
        <div>
          <div className="text-slate-500">Extra credits</div>
          <div className="font-bold text-slate-900">{Number(me?.paidCreditsBalance ?? 0)}</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {BUNDLES.map((bundle) => (
          <button
            key={bundle.key}
            type="button"
            onClick={() => buyBundle(bundle.key)}
            disabled={busyKey === bundle.key}
            className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-black text-slate-900">{bundle.name}</div>
                <div className="mt-1 text-sm text-slate-600">{bundle.note}</div>
              </div>
              <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{bundle.priceLabel}</div>
            </div>

            <div className="mt-6 text-3xl font-black text-slate-900">{bundle.credits}</div>
            <div className="text-sm text-slate-500">extra credits</div>

            <div className="mt-6 rounded-full border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-900">
              {busyKey === bundle.key ? "Adding…" : "Get this bundle"}
            </div>
          </button>
        ))}
      </div>

      {message ? <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</div> : null}

      <p className="text-xs text-slate-500">
        Daily credits go into your free balance. Bought, bonus, refund, referral, and survey credits appear as extra credits.
      </p>
    </div>
  );
}
