import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";

import { BuyNowButton } from "@/components/BuyNowButton";
import { CountdownChip } from "@/components/CountdownChip";
import { ProductImage } from "@/components/ProductImage";
import { getCurrentActor } from "@/lib/auth";
import { prisma } from "@/lib/db";
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

function gameLabel(k?: string | null) {
  if (!k) return null;
  if (k === "memory-sprint" || k === "number-memory") return "Memory Sprint";
  if (k === "alphabet-sprint" || k === "trace-run") return "Alphabet Sprint";
  if (k === "quick-stop" || k === "precision-timer" || k === "stop-zero") return "Quick Stop";
  if (k === "moving-zone" || k === "rhythm-hold") return "Moving Zone Hold";
  if (k === "flash-count" || k === "burst-match" || k === "tap-speed" || k === "tap-pattern") return "Flash Count";
  if (k === "target-grid" || k === "target-hold") return "Target Grid";
  return k.replace(/[-_]/g, " ");
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
    const primaryImage = product?.imageUrl ?? item.imageUrl ?? fallbackImage;
    const highlights = product?.highlights ?? [];
    const detailText = product?.description ?? item.shortDesc ?? "Prize details coming soon.";
    const officialUrl = product?.officialUrl ?? item.productUrl ?? null;
    const closesAtIso = round?.closesAt ? new Date(round.closesAt).toISOString() : null;
    const progress = publicProgress({
      paidCreditsCollected: Number((round as any).paidCreditsCollected ?? 0),
      activationTargetCredits: Number((round as any).activationTargetCredits ?? 0),
      state: String(round.state || ""),
    });
    const isPlayable = round.state === ROUND_STATES.BUILDING || round.state === ROUND_STATES.ACTIVATED;
    const spentCredits = Number(mySpend._sum.paidUsed ?? 0);
    const game = gameLabel(item.gameKey);

    return (
      <main className="mx-auto max-w-[1260px] px-4 py-4 sm:px-5 lg:px-6">
        <div className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                  {stateLabel(String(round.state || ""))}
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                  Prize {formatZAR(item.prizeValueZAR)}
                </span>
                <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
                  {playCost} credits / play
                </span>
                {game ? (
                  <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
                    {game}
                  </span>
                ) : null}
              </div>

              <h1 className="mt-2.5 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                {item.title}
              </h1>
            </div>

            <div className="p-4 sm:p-5">
              <ProductImage
                primarySrc={primaryImage}
                fallbackSrc={fallbackImage}
                alt={item.title}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50"
                imgClassName="h-[210px] w-full object-contain bg-white p-4 sm:h-[250px]"
              />

              <div className="mt-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Activation progress
                    </div>
                    <div className="mt-1 text-sm text-slate-600">{progress.label}</div>
                  </div>

                  {round.state === ROUND_STATES.ACTIVATED && closesAtIso ? (
                    <CountdownChip closesAt={closesAtIso} state="ACTIVATED" />
                  ) : null}
                </div>

                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-slate-900 transition-all"
                    style={{ width: `${Math.max(6, progress.pct)}%` }}
                  />
                </div>

                <p className="mt-2.5 text-sm text-slate-600">
                  {round.state === ROUND_STATES.ACTIVATED ? "This prize is live now." : "Activation in progress."}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Play</div>
                  <p className="mt-2 text-sm text-slate-600">
                    Submit your score to compete on this item’s leaderboard.
                  </p>
                </div>

                {isPlayable ? (
                  <Link
                    href={`/play/${item.id}`}
                    className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-base font-extrabold text-white transition hover:bg-slate-800"
                  >
                    Play now
                  </Link>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  href={`/item/${item.id}/leaderboard`}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50"
                >
                  Leaderboard
                </Link>

                <BuyNowButton
                  itemId={item.id}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50"
                >
                  Buy now
                </BuyNowButton>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Buy now</div>
              {meWinner ? (
                <p className="mt-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                  You already won this item in the current round.
                </p>
              ) : (
                <>
                  <p className="mt-2 text-sm text-slate-600">
                    Your paid plays on this item build up a discount automatically.
                  </p>
                  <p className="mt-3 text-sm font-medium text-slate-700">
                    Your paid plays on this round: <span className="font-extrabold">{spentCredits}</span>
                  </p>
                </>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {product?.kicker ?? "Product details"}
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-700">{detailText}</p>

              {highlights.length ? (
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {highlights.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-900" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {officialUrl ? (
                <div className="mt-3">
                  <Link
                    href={officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-slate-900 underline underline-offset-4"
                  >
                    View official product page
                  </Link>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    );
  } catch {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-center sm:px-6">
        <h1 className="text-2xl font-black text-slate-950">We couldn’t load this prize right now.</h1>
        <p className="mt-3 text-slate-600">Please return to the home page and try again in a moment.</p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white"
          >
            Back to home
          </Link>
        </div>
      </main>
    );
  }
}
