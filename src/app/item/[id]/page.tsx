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
    if (!round || [ROUND_STATES.CLOSED, ROUND_STATES.PUBLISHED, ROUND_STATES.FAILED, ROUND_STATES.REFUNDED].includes(round.state as any)) {
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
    const game = item.gameKey ? getGameLabel(item.gameKey) : null;

    return (
      <main className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.02fr)_minmax(18rem,0.98fr)] lg:items-start">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="aspect-[16/10] max-h-[24rem] w-full bg-slate-100">
              {primaryImage ? <img src={primaryImage} alt={item.title} className="h-full w-full object-cover" /> : null}
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-800">{stateLabel(String(round.state || ""))}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">Prize {formatZAR(item.prizeValueZAR)}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">{playCost} credits / play</span>
              {game ? <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-800">{game}</span> : null}
            </div>

            <h1 className="text-2xl font-black leading-tight text-slate-950 sm:text-[2rem]">{item.title}</h1>

            <div className="rounded-3xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Activation progress</div>
              <div className="mt-1.5 text-base font-black text-slate-950 sm:text-lg">{progress.label}</div>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-slate-900" style={{ width: `${Math.max(0, Math.min(100, Number(progress.pct ?? 0)))}%` }} />
              </div>
              <div className="mt-2 text-sm text-slate-600">
                {round.state === ROUND_STATES.ACTIVATED ? "This prize is live now." : "Activation in progress."}
              </div>
              {round.state === ROUND_STATES.ACTIVATED && closesAtIso ? (
                <div className="mt-1 text-sm text-slate-500">Closes at {new Date(closesAtIso).toLocaleString("en-ZA")}</div>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {isPlayable ? (
                <Link href={`/play/${item.id}`} className="rounded-2xl bg-slate-900 px-4 py-2.5 text-center text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800">
                  Play now
                </Link>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-center text-sm font-bold text-slate-500">
                  Not open for play
                </div>
              )}
              <Link href={`/item/${item.id}/leaderboard`} className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-bold text-slate-900 transition hover:-translate-y-0.5">
                Leaderboard
              </Link>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Buy now</div>
              {meWinner ? (
                <div className="mt-2 text-sm text-emerald-700">You already won this item in the current round.</div>
              ) : (
                <>
                  <div className="mt-2 text-sm text-slate-600">Your paid plays on this item build up a discount automatically.</div>
                  <div className="mt-1 text-sm text-slate-900">Your paid plays on this round: {spentCredits}</div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{product?.kicker ?? "Product details"}</div>
          <p className="mt-2 text-sm leading-6 text-slate-700">{detailText}</p>
          {highlights.length ? (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {highlights.map((line) => (
                <li key={line} className="flex gap-2 text-sm text-slate-700">
                  <span>•</span>
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
              className="mt-4 inline-flex rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5"
            >
              View official product page
            </a>
          ) : null}
        </div>
      </main>
    );
  } catch {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6">
        <h1 className="text-3xl font-black text-slate-950">We couldn’t load this prize right now.</h1>
        <p className="mt-3 text-sm text-slate-600">Please return to the home page and try again in a moment.</p>
        <Link href="/" className="mt-6 inline-flex rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">
          Back to home
        </Link>
      </main>
    );
  }
}
