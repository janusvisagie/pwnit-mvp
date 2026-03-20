import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";

import { CountdownChip } from "@/components/CountdownChip";
import { getCurrentActor } from "@/lib/auth";
import { prisma } from "@/lib/db";
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
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-black text-slate-900">Missing item id</h1>
          <Link href="/" className="mt-4 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  try {
    const [actor, item] = await Promise.all([getCurrentActor(), prisma.item.findUnique({ where: { id: itemId } })]);
    if (!item) {
      return (
        <main className="mx-auto w-full max-w-4xl px-4 py-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-black text-slate-900">Item not found</h1>
            <Link href="/" className="mt-4 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Back to home
            </Link>
          </div>
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
        <main className="mx-auto w-full max-w-4xl px-4 py-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-black text-slate-900">This item is not accepting plays right now.</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">Please return to the item page or check the leaderboard.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/item/${item.id}/leaderboard`} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                View results
              </Link>
              <Link href={`/item/${item.id}`} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                Back to item
              </Link>
            </div>
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

    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-6 md:py-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Play</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">{item.title}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Play costs {playCost} credits · You have {creditsTotal} credits
              </p>
            </div>

            {roundState === ROUND_STATES.ACTIVATED && closesAtIso ? (
              <div className="shrink-0">
                <CountdownChip closesAt={closesAtIso} state="ACTIVATED" />
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/item/${item.id}`} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
              Item
            </Link>
            <Link href={`/item/${item.id}/leaderboard`} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
              Leaderboard
            </Link>
          </div>

          <div className="mt-6">
            <GameHost itemId={item.id} gameKey={item.gameKey as any} playCost={playCost} credits={creditsTotal} />
          </div>
        </div>
      </main>
    );
  } catch {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-black text-slate-900">We couldn’t load this game right now.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Please go back and try again in a moment.</p>
          <Link href="/" className="mt-5 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Back to home
          </Link>
        </div>
      </main>
    );
  }
}
