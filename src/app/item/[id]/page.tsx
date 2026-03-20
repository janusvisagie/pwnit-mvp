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

export default async function ItemPage({ params }: { params: { id: string } }) {
  noStore();

  const itemId = params?.id;
  if (!itemId) notFound();

  try {
    const [actor, item] = await Promise.all([getCurrentActor(), prisma.item.findUnique({ where: { id: itemId } })]);
    if (!item) notFound();

    let round = await syncRoundLifecycle(item.id);
    if (!round || [ROUND_STATES.CLOSED, ROUND_STATES.PUBLISHED, ROUND_STATES.FAILED, ROUND_STATES.REFUNDED].includes(round.state as any)) {
      round = await ensureCurrentRound(item.id);
    }
    if (!round) notFound();

    const [meWinner, mySpend] = await Promise.all([
      prisma.winner.findFirst({
        where: { itemId, roundId: round.id, userId: actor.user.id, rank: 1, rewardType: "ITEM" },
        select: { id: true },
      }),
      prisma.attempt.aggregate({ where: { itemId, roundId: round.id, userId: actor.user.id }, _sum: { paidUsed: true } }),
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

    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-6 md:py-8">
        <div className="grid gap-5 md:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{stateLabel(String(round.state || ""))}</span>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Prize {formatZAR(item.prizeValueZAR)}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{playCost} credits / play</span>
            </div>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">{item.title}</h1>

            <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
              <ProductImage
                primarySrc={primaryImage}
                fallbackSrc={fallbackImage}
                alt={item.title}
                className="aspect-[4/3] w-full bg-white"
                imgClassName="h-full w-full object-contain"
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link href={`/item/${item.id}/leaderboard`} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                Leaderboard
              </Link>
              {isPlayable ? (
                <Link href={`/play/${item.id}`} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                  Play
                </Link>
              ) : null}
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Activation progress</div>
                  <div className="text-xs text-slate-500">{progress.label}</div>
                </div>
                {round.state === ROUND_STATES.ACTIVATED && closesAtIso ? <CountdownChip closesAt={closesAtIso} state="ACTIVATED" /> : null}
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${Math.max(6, progress.pct)}%` }} />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {round.state === ROUND_STATES.ACTIVATED
                  ? "This prize is live now."
                  : `This round is ${progress.label.toLowerCase()}.`}
              </p>
            </div>
          </section>

          <section className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-lg font-black tracking-tight text-slate-900">Buy Now</h2>
              {meWinner ? (
                <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                  You already won this item in the current round.
                </p>
              ) : (
                <>
                  <p className="mt-3 text-sm leading-6 text-slate-600">Buy Now is always available. Your paid plays on this item build up a discount automatically.</p>
                  <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    Your paid plays on this round: <span className="font-semibold text-slate-900">{spentCredits}</span>
                  </div>
                  <div className="mt-4">
                    <BuyNowButton
                      itemId={item.id}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Buy now
                    </BuyNowButton>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{product?.kicker ?? "Product details"}</div>
              <p className="mt-3 text-sm leading-6 text-slate-700">{detailText}</p>
              {highlights.length ? (
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  {highlights.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-900" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {officialUrl ? (
                <a
                  href={officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  View official product page
                </a>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    );
  } catch {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-black text-slate-900">We couldn’t load this prize right now.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Please return to the home page and try again in a moment.</p>
          <Link href="/" className="mt-5 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Back to home
          </Link>
        </div>
      </main>
    );
  }
}
