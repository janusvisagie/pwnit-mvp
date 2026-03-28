import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { getCurrentActor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGameLabel } from "@/lib/gameRules";
import { playCostForPrize } from "@/lib/playCost";
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

    const [meWinner, mySpend] = await Promise.all([
      prisma.winner.findFirst({
        where: { itemId, roundId: round.id, userId: actor.user.id, rank: 1, rewardType: "ITEM" },
        select: { id: true },
      }),
      prisma.attempt.aggregate({
        where: { itemId, roundId: round.id, userId: actor.user.id },
        _sum: { paidUsed: true },
      }),
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

    return (
      <main className="mx-auto max-w-5xl px-3 py-2 sm:px-4 lg:px-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700 ring-1 ring-slate-200">
                    {stateLabel(String(round.state || ""))}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-700 ring-1 ring-slate-200">
                    Prize {formatZAR(item.prizeValueZAR)}
                  </span>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700 ring-1 ring-blue-200">
                    {playCost} credits / play
                  </span>
                  {game ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      {game}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="bg-slate-50 p-3">
                {primaryImage ? (
                  <img
                    src={primaryImage}
                    alt={item.title}
                    className="mx-auto h-44 w-full object-contain sm:h-52"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center rounded-2xl bg-white text-sm text-slate-500 sm:h-52">
                    Image coming soon
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
              <h1 className="text-xl font-black leading-tight text-slate-950 sm:text-2xl">{item.title}</h1>

              <div className="mt-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Activation progress
                    </div>
                    <div className="mt-1 text-base font-black text-slate-950">{progressLabel}</div>
                  </div>
                  {round.state === ROUND_STATES.ACTIVATED && closesAtIso ? (
                    <div className="text-right text-xs text-slate-600">
                      <div className="font-semibold text-slate-800">Closes at</div>
                      <div>{new Date(closesAtIso).toLocaleString("en-ZA")}</div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-900"
                    style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                  />
                </div>

                <div className="mt-2 text-sm text-slate-600">
                  {round.state === ROUND_STATES.ACTIVATED ? "This prize is live now." : "Activation in progress."}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {isPlayable ? (
                  <Link
                    href={`/play/${itemId}`}
                    className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
                  >
                    Play now
                  </Link>
                ) : (
                  <span className="rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-500">
                    Not open for play
                  </span>
                )}

                <Link
                  href={`/item/${itemId}/leaderboard`}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900"
                >
                  Leaderboard
                </Link>

                <Link
                  href={`/item/${itemId}/buy`}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900"
                >
                  Buy now
                </Link>
              </div>

              <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                {meWinner ? (
                  <div className="font-semibold text-emerald-700">
                    You already won this item in the current round.
                  </div>
                ) : (
                  <>
                    <div>Your paid plays on this item build up a discount automatically.</div>
                    <div className="mt-1 font-semibold text-slate-900">Your paid plays on this round: {spentCredits}</div>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {product?.kicker ?? "Product details"}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">{detailText}</p>

              {highlights.length ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {highlights.map((line) => (
                    <div key={line} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      • {line}
                    </div>
                  ))}
                </div>
              ) : null}

              {officialUrl ? (
                <div className="mt-3">
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
            </div>
          </div>
        </div>
      </main>
    );
  } catch {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-black text-slate-950">We couldn’t load this prize right now.</h1>
        <p className="mt-3 text-slate-600">Please return to the home page and try again in a moment.</p>
        <div className="mt-5">
          <Link href="/" className="text-sm font-semibold text-slate-900 underline underline-offset-4">
            Back to home
          </Link>
        </div>
      </main>
    );
  }
}
