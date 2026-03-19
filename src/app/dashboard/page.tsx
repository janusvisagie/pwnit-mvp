import ProfileSharePanel from "@/components/ProfileSharePanel";
import { getCurrentActor } from "@/lib/auth";
import { getDashboardProfile } from "@/lib/gamification";

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
      {hint ? <p className="mt-2 text-sm leading-5 text-slate-600">{hint}</p> : null}
    </div>
  );
}

export default async function DashboardPage() {
  const actor = await getCurrentActor();
  const profile = await getDashboardProfile(actor.user.id);

  if (!profile) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 md:px-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">Dashboard</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">Profile not available yet</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
            Play a few rounds and your stats, achievements, badges, and sharing options will appear here.
          </p>
        </section>
      </main>
    );
  }

  const intro = actor.isGuest
    ? "You are viewing your guest profile for this device. Create an account later if you want to keep progress across devices."
    : "Track your progress, unlock badges, and share your best moments.";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">Your profile</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{profile.displayName}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">{intro}</p>
          </div>
          {profile.referralCode ? (
            <div className="rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white">
              <p className="font-semibold">Referral code</p>
              <p className="mt-1 text-lg font-bold tracking-wide">{profile.referralCode.toUpperCase()}</p>
            </div>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Your Stats</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Games played" value={String(profile.stats.gamesPlayed)} />
          <StatCard label="Best rank" value={profile.stats.bestRank ? `#${profile.stats.bestRank}` : "—"} hint={profile.stats.bestRankLabel} />
          <StatCard label="Total winnings" value={profile.stats.totalWinningsLabel} hint="Prize value won from first-place finishes." />
          <StatCard label="Streak" value={`${profile.stats.streakDays} day${profile.stats.streakDays === 1 ? "" : "s"} 🔥`} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Achievements Unlocked</h2>
          <div className="mt-4 space-y-3">
            {profile.achievements.map((achievement) => (
              <div
                key={achievement.key}
                className={[
                  "rounded-2xl border p-4",
                  achievement.unlocked ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-xl" aria-hidden>
                    {achievement.unlocked ? "✓" : "⚪"}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{achievement.title}</p>
                    <p className="mt-1 text-sm leading-5 text-slate-600">{achievement.description}</p>
                    {achievement.progressLabel ? <p className="mt-2 text-sm font-medium text-slate-700">{achievement.progressLabel}</p> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Badges</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {profile.badges.length ? (
              profile.badges.map((badge) => (
                <span key={badge} className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800">
                  {badge}
                </span>
              ))
            ) : (
              <p className="text-sm leading-6 text-slate-600">Play a few different game types to start unlocking specialist badges.</p>
            )}
          </div>

          <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-semibold">Growth loops</p>
            <p className="mt-2 leading-6">
              Qualified referrals: <span className="font-bold">{profile.stats.qualifiedReferrals}</span>
              <br />
              Rewarded feedback submissions: <span className="font-bold">{profile.stats.feedbackRewards}</span>
            </p>
          </div>
        </div>
      </section>

      <ProfileSharePanel
        headline={profile.share.headline}
        body={profile.share.body}
        shareUrl={profile.referralLink || process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "/"}
        challengeUrl={profile.referralLink}
      />
    </main>
  );
}
