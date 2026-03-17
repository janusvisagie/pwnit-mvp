"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const BUNDLES = [
  { key: "small", credits: 10, price: "R10" },
  { key: "medium", credits: 25, price: "R25" },
  { key: "large", credits: 60, price: "R60" },
];

type Me = {
  ok: boolean;
  isGuest: boolean;
  actorLabel: string;
};

export default function BuyCreditsPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loginHref = useMemo(() => "/login?next=%2Fbuy-credits", []);

  useEffect(() => {
    async function loadMe() {
      const response = await fetch("/api/me", { cache: "no-store" });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) return;
      setMe({ ok: true, isGuest: Boolean(data.isGuest), actorLabel: String(data.actorLabel || "") });
    }

    void loadMe();
  }, []);

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

      window.dispatchEvent(new Event("pwnit:credits"));
      setMessage(`Added ${data.added} credits. New paid balance: ${data.paidCreditsBalance}.`);
    } catch (error: any) {
      setMessage(error?.message || "Could not add credits.");
    } finally {
      setBusyKey(null);
    }
  }

  if (!me) {
    return <div className="text-sm text-slate-600">Loading…</div>;
  }

  if (me.isGuest) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">Buy credits</h1>
        <p className="text-sm text-slate-600">
          Buying credits requires a signed-in account so the credits stay attached to the right person.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={loginHref}
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Sign in to continue
          </Link>
          <Link
            href="/"
            className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-2">
        <h1 className="text-2xl font-black text-slate-900">Buy credits</h1>
        <p className="text-sm text-slate-600">Signed in as {me.actorLabel}.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {BUNDLES.map((bundle) => (
          <button
            key={bundle.key}
            type="button"
            onClick={() => buyBundle(bundle.key)}
            disabled={busyKey === bundle.key}
            className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="text-lg font-black text-slate-900">{bundle.credits} credits</div>
            <div className="mt-1 text-sm text-slate-600">{bundle.price}</div>
            <div className="mt-4 text-sm font-semibold text-slate-900">
              {busyKey === bundle.key ? "Processing…" : "Buy bundle"}
            </div>
          </button>
        ))}
      </div>

      {message ? <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</div> : null}

      <p className="text-xs text-slate-500">
        This is still an MVP placeholder. The route now requires a real signed-in account, even though the top-up is still simulated.
      </p>
    </div>
  );
}
