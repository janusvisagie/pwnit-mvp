import Link from "next/link";

import { ReferralPanel } from "@/components/ReferralPanel";
import {
  getReferralPageData,
  REFERRAL_ACTIVATION_SUPPORT,
  REFERRAL_REFERRER_BONUS,
} from "@/lib/referrals";

export default async function ReferralsPage() {
  const data = await getReferralPageData();
  const leaderboard = data.monthlyLeaderboard.slice(0, 10);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 text-slate-900 sm:px-5 lg:px-6">
      <div className="space-y-6">
        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Grow PwnIt</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            Invite friends. Help prizes go live faster.
          </h1>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600 md:text-base">
            Each qualified referral triggers PwnIt&apos;s 50/50 growth split.
            <span className="font-semibold text-slate-900"> {REFERRAL_ACTIVATION_SUPPORT} hidden activation credits</span>
            {" "}support the first prize your friend starts playing, and
            <span className="font-semibold text-slate-900"> {REFERRAL_REFERRER_BONUS} bonus credits</span>
            {" "}come back to you. The Community Builder leaderboard resets every month.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Qualified referral</div>
              <div className="mt-2 text-lg font-black text-slate-950">Sign up + first real play</div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                A referral qualifies once your friend arrives through your link and completes a first real play.
              </p>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">50 / 50 growth split</div>
              <div className="mt-2 text-lg font-black text-slate-950">
                {REFERRAL_ACTIVATION_SUPPORT} hidden + {REFERRAL_REFERRER_BONUS} back to you
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                PwnIt quietly keeps momentum moving while still giving the referrer a visible reward.
              </p>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Monthly leaderboard</div>
              <div className="mt-2 text-lg font-black text-slate-950">Community Builder</div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Top spot each month earns a featured badge and a boosted vote on the next prize shortlist.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                {data.monthlyLabel}
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Community Builder leaderboard</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                Ranked by qualified referrals this month. Ties break on earned bonus credits.
              </p>
            </div>

            {data.myMonthlyRank ? (
              <div className="rounded-3xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
                Your current rank: <span className="font-black">#{data.myMonthlyRank}</span>
              </div>
            ) : null}
          </div>

          <div className="mt-5 overflow-hidden rounded-[28px] border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50">
                  <tr className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-4 py-3 font-semibold">Rank</th>
                    <th className="px-4 py-3 font-semibold">Player</th>
                    <th className="px-4 py-3 font-semibold">Qualified</th>
                    <th className="px-4 py-3 font-semibold">Bonus credits</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.length ? (
                    leaderboard.map((entry) => (
                      <tr key={entry.userId} className="border-t border-slate-100">
                        <td className="px-4 py-3 font-black text-slate-950">#{entry.rank}</td>
                        <td className="px-4 py-3">{entry.label}</td>
                        <td className="px-4 py-3">{entry.qualifiedReferrals}</td>
                        <td className="px-4 py-3">{entry.bonusCredits}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                        No qualified referrals yet this month. Be the first Community Builder on the board.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <ReferralPanel
          isGuest={data.actor.isGuest || data.actor.isDemoUser}
          myCode={data.myCode}
          shareUrl={data.shareUrl}
          incomingCode={data.incomingCode}
          activeReferral={
            data.activeReferral
              ? {
                  code: data.activeReferral.code,
                  status: data.activeReferral.status,
                  referrer: data.activeReferral.referrer,
                }
              : null
          }
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
          activationSupportCredits={REFERRAL_ACTIVATION_SUPPORT}
          bonusCreditsPerReferral={REFERRAL_REFERRER_BONUS}
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
