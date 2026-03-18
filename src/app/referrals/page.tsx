import Link from "next/link";

import { ReferralPanel } from "@/components/ReferralPanel";
import { getReferralPageData, REFERRAL_REFRIEND_BONUS, REFERRAL_REFERRER_BONUS } from "@/lib/referrals";

export default async function ReferralsPage() {
  const data = await getReferralPageData();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 text-slate-900">
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">Share PwnIt</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Refer a friend</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
            Invite a friend with your link. Once they complete their first real play,
            you get <span className="font-semibold">{REFERRAL_REFERRER_BONUS} free credits</span> and they get <span className="font-semibold">{REFERRAL_REFRIEND_BONUS} free credits</span>.
          </p>
        </section>

        <ReferralPanel
          isGuest={data.actor.isGuest}
          myCode={data.myCode}
          shareUrl={data.shareUrl}
          incomingCode={data.incomingCode}
          activeReferral={data.activeReferral ? {
            code: data.activeReferral.code,
            status: data.activeReferral.status,
            referrer: data.activeReferral.referrer,
          } : null}
          referrals={data.referrals.map((entry) => ({
            id: entry.id,
            createdAt: entry.createdAt.toISOString(),
            status: entry.status,
            referredUserId: entry.referredUserId,
            referrerRewardCredits: Number(entry.referrerRewardCredits ?? 0),
            referredRewardCredits: Number(entry.referredRewardCredits ?? 0),
            referred: entry.referred
              ? {
                  alias: entry.referred.alias ?? null,
                  email: entry.referred.email ?? null,
                }
              : null,
          }))}
          creditedCount={data.creditedCount}
          pendingCount={data.pendingCount}
          totalEarnedCredits={data.totalEarnedCredits}
        />

        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            ← Back to home
          </Link>
          <Link
            href="/feedback"
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            Leave feedback
          </Link>
        </div>
      </div>
    </main>
  );
}
