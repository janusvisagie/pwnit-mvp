"use client";

import { useMemo, useState, type FormEvent } from "react";

type ReferralEntry = {
  id: string;
  createdAt: string;
  status: string;
  referredUserId: string | null;
  referrerRewardCredits: number;
  referrerRewardType: "CREDITS" | "DISCOUNT";
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
  totalEarnedDiscountZAR,
  availableReferralDiscountZAR,
  rewardPreference,
  verifiedSubscriberCredits,
  rewardValue,
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
  totalEarnedDiscountZAR: number;
  availableReferralDiscountZAR: number;
  rewardPreference: "CREDITS" | "DISCOUNT";
  verifiedSubscriberCredits: number;
  rewardValue: number;
}) {
  const [manualCode, setManualCode] = useState(incomingCode ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [savingPreference, setSavingPreference] = useState(false);
  const [selectedPreference, setSelectedPreference] = useState<"CREDITS" | "DISCOUNT">(rewardPreference);

  const activeReferrerLabel = useMemo(() => {
    if (!activeReferral?.referrer) return null;
    return activeReferral.referrer.alias || activeReferral.referrer.email || "your friend";
  }, [activeReferral]);

  async function copyLink() {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setMessage("Invite link copied.");
    } catch {
      setMessage("Could not copy automatically. You can still copy the link manually below.");
    }
  }

  async function applyCode(event: FormEvent) {
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
        setMessage(data?.error || "Could not save that invite code.");
        return;
      }

      setManualCode(String(data.code || manualCode).toUpperCase());
      setMessage("Invite code saved. Finish your first real play to qualify it.");
    } finally {
      setBusy(false);
    }
  }

  async function savePreference(preference: "CREDITS" | "DISCOUNT") {
    setSelectedPreference(preference);
    setSavingPreference(true);
    setMessage(null);
    try {
      const response = await fetch("/api/referrals/preference", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ preference }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        setMessage(data?.error || "Could not save your reward choice.");
        return;
      }
      setMessage(preference === "DISCOUNT" ? "Future referral rewards will go to your referral discount wallet." : "Future referral rewards will arrive as bonus credits.");
    } finally {
      setSavingPreference(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Invite and earn</div>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Your referral hub</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            Each qualified referral adds <span className="font-semibold text-slate-900">+{verifiedSubscriberCredits} activation credits</span> to the specific shared prize. You choose whether your personal reward lands as <span className="font-semibold text-slate-900">{rewardValue} bonus credits</span> or <span className="font-semibold text-slate-900">R{rewardValue} referral discount</span>.
          </p>
        </div>

        {isGuest ? (
          <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-950">
            Sign in first to unlock your own invite link. You can still save a friend&apos;s invite code below.
          </div>
        ) : (
          <>
            <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Your code</div>
                <div className="mt-2 text-3xl font-black tracking-[0.14em] text-slate-950">{myCode ?? "—"}</div>
                <div className="mt-4 rounded-3xl bg-white px-4 py-3 text-xs leading-5 text-slate-600 break-all ring-1 ring-slate-200">
                  {shareUrl ?? "Invite link will appear here."}
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" onClick={copyLink} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                    Copy invite link
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Qualified</div>
                  <div className="mt-2 text-2xl font-black text-slate-950">{creditedCount}</div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pending</div>
                  <div className="mt-2 text-2xl font-black text-slate-950">{pendingCount}</div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Credits earned</div>
                  <div className="mt-2 text-2xl font-black text-slate-950">{totalEarnedCredits}</div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Discount earned</div>
                  <div className="mt-2 text-2xl font-black text-slate-950">R{totalEarnedDiscountZAR}</div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:col-span-2 lg:col-span-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Referral discount wallet</div>
                  <div className="mt-2 text-2xl font-black text-slate-950">R{availableReferralDiscountZAR}</div>
                  <div className="mt-1 text-sm text-slate-600">Shown separately from any gameplay discount you have already earned.</div>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[28px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Your reward choice for future qualified referrals</div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => savePreference("CREDITS")}
                  disabled={savingPreference}
                  className={`rounded-3xl border px-4 py-4 text-left transition ${selectedPreference === "CREDITS" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"}`}
                >
                  <div className={`text-xs font-semibold uppercase tracking-[0.18em] ${selectedPreference === "CREDITS" ? "text-slate-300" : "text-slate-500"}`}>Default option</div>
                  <div className="mt-2 text-lg font-black">{rewardValue} bonus credits</div>
                  <p className={`mt-2 text-sm leading-6 ${selectedPreference === "CREDITS" ? "text-slate-200" : "text-slate-600"}`}>
                    Best if you want to keep playing immediately. This is the current default highlight.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => savePreference("DISCOUNT")}
                  disabled={savingPreference}
                  className={`rounded-3xl border px-4 py-4 text-left transition ${selectedPreference === "DISCOUNT" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"}`}
                >
                  <div className={`text-xs font-semibold uppercase tracking-[0.18em] ${selectedPreference === "DISCOUNT" ? "text-slate-300" : "text-slate-500"}`}>Alternative</div>
                  <div className="mt-2 text-lg font-black">R{rewardValue} referral discount</div>
                  <p className={`mt-2 text-sm leading-6 ${selectedPreference === "DISCOUNT" ? "text-slate-200" : "text-slate-600"}`}>
                    Best if you want to build a visible buy-now discount wallet.
                  </p>
                </button>
              </div>
              {savingPreference ? <div className="mt-3 text-sm text-slate-500">Saving preference…</div> : null}
            </div>
          </>
        )}
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-lg font-black text-slate-950">Use a friend&apos;s invite code</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
          Save a code here if a friend sent you one directly instead of a full invite link. To support a specific prize, use the full item link rather than code-only entry.
        </p>

        <form onSubmit={applyCode} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={manualCode}
            onChange={(event) => setManualCode(event.target.value.toUpperCase())}
            placeholder="Enter invite code"
            className="min-h-11 flex-1 rounded-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          />
          <button type="submit" disabled={busy} className="min-h-11 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
            {busy ? "Saving…" : "Save code"}
          </button>
        </form>

        {activeReferral ? (
          <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">
            Active invite: <span className="font-semibold">{activeReferral.code}</span>
            {activeReferrerLabel ? <> from <span className="font-semibold">{activeReferrerLabel}</span></> : null}. Status: {activeReferral.status === "CREDITED" ? "Qualified" : "Pending first real play"}.
          </div>
        ) : null}

        {message ? <div className="mt-4 rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-700">{message}</div> : null}
      </section>

      {!isGuest && referrals.length ? (
        <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-lg font-black text-slate-950">Recent referrals</h3>
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
                    <td className="py-3 pr-4">{entry.referred?.alias || entry.referred?.email || "Pending player"}</td>
                    <td className="py-3 pr-4">{entry.status === "CREDITED" ? "Qualified" : "Pending first real play"}</td>
                    <td className="py-3 pr-4">{entry.referrerRewardType === "DISCOUNT" ? `R${entry.referrerRewardCredits} discount` : `+${entry.referrerRewardCredits} credits`}</td>
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
