"use client";

import Link from "next/link";
import { useState } from "react";

export function InviteFriendsModal({
  itemTitle,
  isGuest,
  referralCode,
  shareUrl,
  verifiedSubscriberCredits,
  rewardValue,
  rewardPreference,
}: {
  itemTitle: string;
  isGuest: boolean;
  referralCode: string | null;
  shareUrl: string | null;
  verifiedSubscriberCredits: number;
  rewardValue: number;
  rewardPreference: "CREDITS" | "DISCOUNT";
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setMessage("Invite link copied.");
    } catch {
      setMessage("Could not copy automatically. You can still copy the link manually below.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMessage(null);
          setOpen(true);
        }}
        className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-900 transition hover:border-blue-300 hover:bg-blue-100"
      >
        Invite friends
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6">
          <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Share this prize</div>
                <h2 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">Invite verified subscribers to help move {itemTitle} live</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                aria-label="Close invite panel"
              >
                Close
              </button>
            </div>

            <div className="space-y-5 px-5 py-5 sm:px-6">
              <p className="text-sm leading-6 text-slate-600 sm:text-base">
                Each qualified referral helps in two visible ways.
                <span className="font-semibold text-slate-900"> +{verifiedSubscriberCredits} activation credits</span>
                {" "}go to this shared prize, and you receive a personal reward.
                <span className="font-semibold text-slate-900"> Your current choice is {rewardPreference === "DISCOUNT" ? `R${rewardValue} referral discount` : `${rewardValue} bonus credits`}.</span>
              </p>

              {isGuest ? (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 sm:p-5">
                  <div className="text-base font-bold">Sign in to unlock your invite link</div>
                  <p className="mt-2 leading-6 text-amber-900">
                    Guest mode can still play, but you need an account to earn referral rewards and appear on the monthly Community Builder leaderboard.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link href="/login" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                      Sign in / create account
                    </Link>
                    <Link href="/referrals" className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
                      View referral rules
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <div className="grid gap-4 lg:grid-cols-[0.8fr,1.2fr]">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Your code</div>
                      <div className="mt-2 text-2xl font-black tracking-[0.14em] text-slate-950">{referralCode ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Prize invite link</div>
                      <div className="mt-2 rounded-2xl bg-white px-4 py-3 text-xs leading-5 text-slate-600 break-all ring-1 ring-slate-200">
                        {shareUrl ?? "Invite link will appear here once your account is ready."}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button type="button" onClick={copyLink} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                      Copy invite link
                    </button>
                    <Link href="/referrals" className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
                      Full referral rules
                    </Link>
                  </div>

                  {message ? (
                    <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-200">
                      {message}
                    </div>
                  ) : null}
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Qualified referral</div>
                  <div className="mt-2 text-base font-black text-slate-950">Sign up + first registered play</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    A referral qualifies once your friend arrives through your item link and completes a first real registered play.
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Visible prize support</div>
                  <div className="mt-2 text-base font-black text-slate-950">+{verifiedSubscriberCredits} activation credits</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Verified subscribers contribute directly to the activation bar of the specific prize they were invited to.
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Your reward</div>
                  <div className="mt-2 text-base font-black text-slate-950">{rewardValue} credits or R{rewardValue} discount</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Bonus credits are the default. You can switch future rewards to referral discount in your referral hub.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default InviteFriendsModal;
