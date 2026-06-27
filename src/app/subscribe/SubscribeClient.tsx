"use client";

import { useEffect, useState } from "react";

type Plan = { planKey: string; feeZAR: number; creditsPerCycle: number; cycleDays: number };
type Sub = {
  id: string;
  status: string;
  creditsPerCycle: number;
  feeZAR: number;
  currentPeriodEnd: string;
  grantsCount: number;
} | null;

export default function SubscribeClient() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [sub, setSub] = useState<Sub>(null);
  const [guest, setGuest] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/subscribe", { cache: "no-store" });
    const d = await res.json().catch(() => ({}));
    if (d?.ok) {
      setPlan(d.plan);
      setSub(d.subscription);
      setGuest(Boolean(d.guest));
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function act(action: "subscribe" | "cancel") {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || d?.ok === false) throw new Error(d?.error || "Failed");
      setMsg(action === "cancel" ? "Subscription cancelled." : "You are subscribed.");
      await load();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  const bonus = plan ? plan.creditsPerCycle - plan.feeZAR : 0;
  const plays = plan ? Math.floor(plan.creditsPerCycle / 5) : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-slate-950">PwnIt subscription</h1>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          Prepaid play credits, every month. Subscriber credits work exactly like purchased credits:
          play any campaign, earn your discount, never miss a round.
        </p>
      </div>

      {plan ? (
        <div className="rounded-3xl border border-[#e6ded9] bg-white p-5 shadow-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-black text-slate-950">
              R{plan.feeZAR}
              <span className="text-sm font-bold text-slate-500">/month</span>
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
              R{plan.creditsPerCycle} in credits{bonus > 0 ? ` · +R${bonus} bonus` : ""}
            </span>
          </div>
          <ul className="mt-3 space-y-1 text-sm font-semibold text-slate-700">
            <li>{plays} plays’ worth of credits each cycle</li>
            <li>Credits land in your wallet and roll over</li>
            <li>Earn the 1:1 voucher discount on every paid play, as always</li>
          </ul>

          {guest ? (
            <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-2 text-sm font-bold text-amber-900">
              Sign in to subscribe.
            </p>
          ) : sub ? (
            <div className="mt-4 space-y-2">
              <p className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-900">
                Active · next credits {new Date(sub.currentPeriodEnd).toLocaleDateString()} ·{" "}
                {sub.grantsCount} grant(s) so far
              </p>
              <button
                onClick={() => act("cancel")}
                disabled={busy}
                className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-black text-rose-800 disabled:opacity-50"
              >
                Cancel subscription
              </button>
            </div>
          ) : (
            <button
              onClick={() => act("subscribe")}
              disabled={busy}
              className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"
            >
              Subscribe
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm font-semibold text-slate-400">Loading…</p>
      )}

      {msg ? <p className="text-sm font-bold text-sky-900">{msg}</p> : null}
      <p className="text-xs font-semibold text-slate-400">
        Phase 1: no payment is taken yet. Subscribing reserves your plan; credits are granted on renewal
        (or by an admin during testing).
      </p>
    </div>
  );
}
