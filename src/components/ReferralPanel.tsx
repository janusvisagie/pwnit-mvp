"use client";

import { useMemo, useState } from "react";

type ReferralEntry = {
  id: string;
  createdAt: string;
  status: string;
  referredUserId: string | null;
  referrerRewardCredits: number;
  referredRewardCredits: number;
  referred: {
    alias: string | null;
    email: string | null;
  } | null;
};

type ActiveReferral = {
  code: string;
  status: string;
  referrer: {
    alias: string | null;
    email: string | null;
  };
} | null;

export function ReferralPanel({
  isGuest,
  myCode,
  shareUrl,
  incomingCode,
  activeReferral,
  referrals,
  creditedCount,
  pendingCount,
  totalEarnedCredits,
}: {
  isGuest: boolean;
  myCode: string | null;
  shareUrl: string | null;
  incomingCode: string | null;
  activeReferral: ActiveReferral;
  referrals: ReferralEntry[];
  creditedCount: number;
  pendingCount: number;
  totalEarnedCredits: number;
}) {
  const [manualCode, setManualCode] = useState(incomingCode ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const activeReferrerLabel = useMemo(() => {
    if (!activeReferral?.referrer) return null;
    return activeReferral.referrer.alias || activeReferral.referrer.email || "your friend";
  }, [activeReferral]);

  async function copyLink() {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setMessage("Referral link copied.");
    } catch {
      setMessage("Could not copy automatically. You can still copy the link manually below.");
    }
  }

  async function applyCode(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/api/referrals/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: manualCode }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        setMessage(data?.error || "Could not save that referral code.");
        return;
      }

      setManualCode(String(data.code || manualCode).toUpperCase());
      setMessage("Referral code saved. Once you complete your first real play, the bonus can be credited.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Referral rewards</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Share your code. When a new player arrives through your link and completes their first real play,
          you receive <span className="font-semibold">20 free credits</span> and they receive <span className="font-semibold">10 free credits</span>.
        </p>

        {isGuest ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Sign in first to get your own referral link. You can still enter a friend&apos;s referral code below.
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Your code</div>
              <div className="mt-2 text-2xl font-black tracking-wide text-slate-900">{myCode ?? "—"}</div>
              <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-xs text-slate-600 break-all">
                {shareUrl ?? "Referral link will appear here."}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={copyLink}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Copy link
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Credited</div>
                <div className="mt-2 text-2xl font-black text-slate-900">{creditedCount}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pending</div>
                <div className="mt-2 text-2xl font-black text-slate-900">{pendingCount}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Credits earned</div>
                <div className="mt-2 text-2xl font-black text-slate-900">{totalEarnedCredits}</div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Use a friend&apos;s referral code</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Use this if somebody sent you a code instead of a direct link.
        </p>

        <form onSubmit={applyCode} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={manualCode}
            onChange={(event) => setManualCode(event.target.value.toUpperCase())}
            placeholder="Enter referral code"
            className="min-h-11 flex-1 rounded-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          />
          <button
            type="submit"
            disabled={busy}
            className="min-h-11 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save code"}
          </button>
        </form>

        {activeReferral ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Active referral: <span className="font-semibold">{activeReferral.code}</span>
            {activeReferrerLabel ? <> from <span className="font-semibold">{activeReferrerLabel}</span></> : null}. Status: {activeReferral.status.toLowerCase()}.
          </div>
        ) : null}

        {message ? <div className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</div> : null}
      </section>

      {!isGuest && referrals.length ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Recent referrals</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <th className="pb-3 pr-4 font-semibold">Friend</th>
                  <th className="pb-3 pr-4 font-semibold">Status</th>
                  <th className="pb-3 pr-4 font-semibold">Your reward</th>
                  <th className="pb-3 font-semibold">Started</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-100 align-top last:border-b-0">
                    <td className="py-3 pr-4">
                      {entry.referred?.alias || entry.referred?.email || "Pending player"}
                    </td>
                    <td className="py-3 pr-4">{entry.status === "CREDITED" ? "Credited" : "Pending first real play"}</td>
                    <td className="py-3 pr-4">+{entry.referrerRewardCredits}</td>
                    <td className="py-3">{new Date(entry.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default ReferralPanel;
