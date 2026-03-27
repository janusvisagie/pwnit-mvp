import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";

import { CountdownChip } from "@/components/CountdownChip";
import { getCurrentActor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGameLabel } from "@/lib/gameRules";
import { playCostForPrize } from "@/lib/playCost";
import { ensureCurrentRound, ROUND_STATES, syncRoundLifecycle } from "@/lib/rounds";

import GameHost from "./_components/GameHost";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PlayPage({ params }: { params: { itemId: string } }) {
  noStore();

  const itemId = params?.itemId;
  if (!itemId) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6">
        <h1 className="text-3xl font-black text-slate-950">Missing item id</h1>
        <Link href="/" className="mt-6 inline-flex rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">
          Back to home
        </Link>
      </main>
    );
  }

  try {
    const [actor, item] = await Promise.all([
      getCurrentActor(),
      prisma.item.findUnique({ where: { id: itemId } }),
    ]);

    if (!item) {
      return (
        <main className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6">
          <h1 className="text-3xl font-black text-slate-950">Item not found</h1>
          <Link href="/" className="mt-6 inline-flex rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">
            Back to home
          </Link>
        </main>
      );
    }

    let round = await syncRoundLifecycle(item.id);
    if (!round || [ROUND_STATES.CLOSED, ROUND_STATES.PUBLISHED, ROUND_STATES.FAILED, ROUND_STATES.REFUNDED].includes(round.state as any)) {
      round = await ensureCurrentRound(item.id);
    }

    const roundState = String(round?.state || "").toUpperCase();
    const isPlayable = roundState === ROUND_STATES.BUILDING || roundState === ROUND_STATES.ACTIVATED;

    if (!isPlayable) {
      return (
        <main className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6">
          <h1 className="text-3xl font-black text-slate-950">This item is not accepting plays right now.</h1>
          <p className="mt-3 text-sm text-slate-600">Please return to the item page or check the leaderboard.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={`/item/${itemId}/leaderboard`} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900">
              View results
            </Link>
            <Link href={`/item/${itemId}`} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">
              Back to item
            </Link>
          </div>
        </main>
      );
    }

    const closesAtIso = round?.closesAt
      ? new Date(round.closesAt).toISOString()
      : item.closesAt
        ? new Date(item.closesAt).toISOString()
        : null;
    const playCost = playCostForPrize(item.prizeValueZAR);
    const free = Number(actor.user.freeCreditsBalance ?? 0);
    const extra = Number(actor.user.paidCreditsBalance ?? 0);
    const creditsTotal = free + extra;
    const gameLabel = item.gameKey ? getGameLabel(item.gameKey) : "Quick Skill Game";

    return (
      <main className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Play</div>
            <h1 className="mt-1 text-2xl font-black leading-tight text-slate-950 sm:text-[2rem]">{item.title}</h1>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-800">{gameLabel}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">{playCost} credits / play</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">Wallet {creditsTotal}</span>
              {roundState === ROUND_STATES.ACTIVATED && closesAtIso ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">
                  <CountdownChip state={roundState} closesAt={closesAtIso} />
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href={`/item/${itemId}/leaderboard`} className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5">
              Leaderboard
            </Link>
            <Link href={`/item/${itemId}`} className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5">
              Back to item
            </Link>
          </div>
        </div>

        <GameHost itemId={item.id} gameKey={item.gameKey as any} playCost={playCost} credits={creditsTotal} />
      </main>
    );
  } catch {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6">
        <h1 className="text-3xl font-black text-slate-950">We couldn’t load this game right now.</h1>
        <p className="mt-3 text-sm text-slate-600">Please go back and try again in a moment.</p>
        <Link href="/" className="mt-6 inline-flex rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">
          Back to home
        </Link>
      </main>
    );
  }
}
