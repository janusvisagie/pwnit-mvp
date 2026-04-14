import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";

import { InviteFriendsModal } from "@/components/InviteFriendsModal";
import { getCurrentActor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGameLabel } from "@/lib/gameRules";
import { playCostForPrize } from "@/lib/playCost";
import {
  ensureReferralCodeForUser,
  REFERRAL_ACTIVATION_SUPPORT,
  REFERRAL_REFERRER_BONUS,
} from "@/lib/referrals";
import { getFallbackProductImage, getProductContent } from "@/lib/productCatalog";
import { ensureCurrentRound, publicProgress, ROUND_STATES, syncRoundLifecycle } from "@/lib/rounds";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatZAR(v: number) {
  return `R${Number(v || 0).toLocaleString("en-ZA")}`;
}

function stateLabel(state: string) {
  if (state === ROUND_STATES.ACTIVATED) return "Activated";
  if (state === ROUND_STATES.BUILDING) return "Building";
  if (state === ROUND_STATES.PUBLISHED) return "Results published";
  if (state === ROUND_STATES.CLOSED) return "Closed";
  if (state === ROUND_STATES.FAILED || state === ROUND_STATES.REFUNDED) return "Refunded";
  return "Open";
}

export default async function ItemPage({ params }: { params: { id: string } }) {
  noStore();

  const itemId = params?.id;
  if (!itemId) notFound();

  try {
    const [actor, item] = await Promise.all([
      getCurrentActor(),
      prisma.item.findUnique({ where: { id: itemId } }),
    ]);

    if (!item) notFound();

    let round = await syncRoundLifecycle(item.id);
    if (
      !round ||
      [ROUND_STATES.CLOSED, ROUND_STATES.PUBLISHED, ROUND_STATES.FAILED, ROUND_STATES.REFUNDED].includes(
        round.state as any,
      )
    ) {
      round = await ensureCurrentRound(item.id);
    }
    if (!round) notFound();

    const [meWinner, mySpend, myCode] = await Promise.all([
      prisma.winner.findFirst({
        where: { itemId, roundId: round.id, userId: actor.user.id, rank: 1, rewardType: "ITEM" },
        select: { id: true },
      }),
      prisma.attempt.aggregate({
        where: { itemId, roundId: round.id, userId: actor.user.id },
        _sum: { paidUsed: true },
      }),
      actor.isGuest || actor.isDemoUser ? Promise.resolve(null) : ensureReferralCodeForUser(actor.user.id),
    ]);

    const playCost = playCostForPrize(item.prizeValueZAR);
    const product = getProductContent(item.title, item.imageUrl);
    const fallbackImage = getFallbackProductImage(item.title, item.imageUrl);
    const primaryImage = product?.imageUrl ?? item.imageUrl ?? fallbackImage ?? "";
    const highlights = (product?.highlights ?? []).slice(0, 4);
    const detailText = product?.description ?? item.shortDesc ?? "Prize details coming soon.";
    const officialUrl = product?.officialUrl ?? item.productUrl ?? null;
    const closesAtIso = round?.closesAt ? new Date(round.closesAt).toISOString() : null;

    const progress = publicProgress({
      paidCreditsCollected: Number((round as any).paidCreditsCollected ?? 0),
      activationTargetCredits: Number((round as any).activationTargetCredits ?? 0),
      state: String(round.state || ""),
    }) as { pct?: number; label?: string };

    const pct = Math.max(0, Math.min(100, Number(progress?.pct ?? 0)));
    const progressLabel = String(progress?.label ?? "Activation in progress");
    const isPlayable = round.state === ROUND_STATES.BUILDING || round.state === ROUND_STATES.ACTIVATED;
    const spentCredits = Number(mySpend._sum.paidUsed ?? 0);
    const game = item.gameKey ? getGameLabel(item.gameKey) : null;
    const siteUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const shareUrl = myCode
      ? `${siteUrl.replace(/\/$/, "")}/item/${itemId}?ref=${encodeURIComponent(myCode)}`
      : null;
    const progressWidth = round.state === ROUND_STATES.ACTIVATED ? 100 : Math.max(pct, pct > 0 ? 8 : 4);

    return (
      <main className="mx-auto max-w-6xl px-4 py-4 sm:px-5 lg:px-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start">
          <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700 ring-1 ring-slate-200">
                {stateLabel(String(round.state || ""))}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
                Prize {formatZAR(item.prizeValueZAR)}
              </span>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-200">
                {playCost} credits / play
              </span>
              {game ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  {game}
                </span>
              ) : null}
            </div>

            <div className="bg-slate-50 p-4 sm:p-5">
              {primaryImage ? (
                <img
                  src={primaryImage}
                  alt={item.title}
                  className="mx-auto h-72 w-full object-contain sm:h-80 lg:h-[30rem]"
                />
              ) : (
                <div className="flex h-72 items-center justify-center rounded-3xl bg-white text-base text-slate-500 ring-1 ring-slate-200 sm:h-80 lg:h-[30rem]">
                  Image coming soon
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <section className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Help push this prize live</div>
              <h1 className="mt-2 text-2xl font-black leading-tight tracking-tight text-slate-950 sm:text-3xl">
                {item.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Activation progress builds as players join, play and share. Once this prize activates, the countdown starts and the leaderboard locks in at the finish.
              </p>

              <div className="mt-5 rounded-[28px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Activation progress
                    </div>
                    <div className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">{pct}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-slate-950">{progressLabel}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      {round.state === ROUND_STATES.ACTIVATED
                        ? "This prize is live now."
                        : "Players join, play and share to move it forward."}
                    </div>
                  </div>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all ${round.state === ROUND_STATES.ACTIVATED ? "bg-emerald-500" : "bg-slate-900"}`}
                    style={{ width: `${progressWidth}%` }}
                  />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-slate-600 ring-1 ring-slate-200">
                    <span className="font-semibold text-slate-900">Why share this prize?</span> Qualified referrals keep momentum moving. PwnIt uses a quiet 50/50 growth split: {REFERRAL_ACTIVATION_SUPPORT} hidden activation credits for the first prize your friend starts playing, and {REFERRAL_REFERRER_BONUS} bonus credits back to you.
                  </div>
                  {round.state === ROUND_STATES.ACTIVATED && closesAtIso ? (
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-200 md:text-right">
                      <div className="font-semibold text-slate-900">Closes at</div>
                      <div className="mt-1">{new Date(closesAtIso).toLocaleString("en-ZA")}</div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2.5">
                {isPlayable ? (
                  <Link
                    href={`/play/${itemId}`}
                    className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                  >
                    Play now
                  </Link>
                ) : (
                  <span className="rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-500">
                    Not open for play
                  </span>
                )}

                <InviteFriendsModal
                  itemTitle={item.title}
                  isGuest={actor.isGuest || actor.isDemoUser}
                  referralCode={myCode}
                  shareUrl={shareUrl}
                  activationSupportCredits={REFERRAL_ACTIVATION_SUPPORT}
                  bonusCredits={REFERRAL_REFERRER_BONUS}
                />

                <Link
                  href={`/item/${itemId}/leaderboard`}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
                >
                  Leaderboard
                </Link>

                <Link
                  href={`/item/${itemId}/buy`}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-slate-50"
                >
                  Buy now
                </Link>
              </div>

              <div className="mt-4 rounded-[28px] bg-slate-50 p-4 text-sm text-slate-700">
                {meWinner ? (
                  <div className="font-semibold text-emerald-700">
                    You already won this item in the current round.
                  </div>
                ) : (
                  <>
                    <div>Your paid plays on this item build up a discount automatically.</div>
                    <div className="mt-2 font-semibold text-slate-900">
                      Your paid plays on this round: {spentCredits}
                    </div>
                  </>
                )}
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {product?.kicker ?? "Product details"}
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">{detailText}</p>

              {highlights.length ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {highlights.map((line) => (
                    <div key={line} className="rounded-3xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 ring-1 ring-slate-200">
                      {line}
                    </div>
                  ))}
                </div>
              ) : null}

              {officialUrl ? (
                <div className="mt-4">
                  <a
                    href={officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-slate-900 underline underline-offset-4"
                  >
                    View official product page
                  </a>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </main>
    );
  } catch {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-black text-slate-950">We couldn&apos;t load this prize right now.</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
          Please return to the home page and try again in a moment.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Back to home
        </Link>
      </main>
    );
  }
}
