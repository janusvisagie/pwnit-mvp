"use client";

import Link from "next/link";
import { useState } from "react";

export function InviteFriendsModal({
  itemTitle,
  isGuest,
  referralCode,
  shareUrl,
  activationSupportCredits,
  bonusCredits,
}: {
  itemTitle: string;
  isGuest: boolean;
  referralCode: string | null;
  shareUrl: string | null;
  activationSupportCredits: number;
  bonusCredits: number;
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
                <h2 className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">Invite friends to help move {itemTitle} live</h2>
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
                Qualified referrals help the platform grow in two ways. PwnIt uses a 50/50 growth split:
                <span className="font-semibold text-slate-900"> {activationSupportCredits} hidden activation credits</span>
                {" "}for the first prize your friend starts playing, and
                <span className="font-semibold text-slate-900"> {bonusCredits} bonus credits</span>
                {" "}for you.
              </p>

              {isGuest ? (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 sm:p-5">
                  <div className="text-base font-bold">Sign in to unlock your invite link</div>
                  <p className="mt-2 leading-6 text-amber-900">
                    Guest mode can still play, but you need an account to earn referral rewards and appear on the monthly Community Builder leaderboard.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href="/login"
                      className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Sign in / create account
                    </Link>
                    <Link
                      href="/referrals"
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                    >
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
                    <button
                      type="button"
                      onClick={copyLink}
                      className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Copy invite link
                    </button>
                    <Link
                      href="/referrals"
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                    >
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
                  <div className="mt-2 text-base font-black text-slate-950">Sign up + first real play</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    A referral qualifies once your friend arrives through your link and completes a first real play.
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">50 / 50 growth split</div>
                  <div className="mt-2 text-base font-black text-slate-950">{activationSupportCredits} hidden + {bonusCredits} back to you</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    PwnIt quietly supports activation in the background while still giving the referrer a clear reward.
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Monthly leaderboard</div>
                  <div className="mt-2 text-base font-black text-slate-950">Community Builder</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Top spot each month earns a featured badge and a boosted vote on the next prize shortlist.
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
