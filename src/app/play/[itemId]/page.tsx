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
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-black text-slate-950">Missing item id</h1>
        <div className="mt-5">
          <Link href="/" className="text-sm font-semibold text-slate-900 underline underline-offset-4">
            Back to home
          </Link>
        </div>
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
        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <h1 className="text-2xl font-black text-slate-950">Item not found</h1>
          <div className="mt-5">
            <Link href="/" className="text-sm font-semibold text-slate-900 underline underline-offset-4">
              Back to home
            </Link>
          </div>
        </main>
      );
    }

    let round = await syncRoundLifecycle(item.id);
    if (
      !round ||
      [ROUND_STATES.CLOSED, ROUND_STATES.PUBLISHED, ROUND_STATES.FAILED, ROUND_STATES.REFUNDED].includes(
        round.state as any,
      )
    ) {
      round = await ensureCurrentRound(item.id);
    }

    const roundState = String(round?.state || "").toUpperCase();
    const isPlayable = roundState === ROUND_STATES.BUILDING || roundState === ROUND_STATES.ACTIVATED;

    if (!isPlayable) {
      return (
        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <h1 className="text-2xl font-black text-slate-950">This item is not accepting plays right now.</h1>
          <p className="mt-3 text-slate-600">Please return to the item page or check the leaderboard.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/item/${itemId}/leaderboard`}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900"
            >
              View results
            </Link>
            <Link
              href={`/item/${itemId}`}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900"
            >
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

    return (
      <main className="mx-auto max-w-[860px] px-3 py-1 sm:px-4 lg:px-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-2.5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {playCost} credits / play
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
              Wallet {creditsTotal}
            </span>
            {roundState === ROUND_STATES.ACTIVATED && closesAtIso ? (
              <CountdownChip closesAt={closesAtIso} state="ACTIVATED" />
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Play</div>
              <h1 className="mt-0.5 text-base font-black text-slate-950 sm:text-lg">{item.title}</h1>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/item/${itemId}/leaderboard`}
                className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900"
              >
                Leaderboard
              </Link>
              <Link
                href={`/item/${itemId}`}
                className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900"
              >
                Back to item
              </Link>
            </div>
          </div>

          <div className="mt-2">
            <GameHost itemId={itemId} gameKey={item.gameKey as any} playCost={playCost} credits={creditsTotal} />
          </div>
        </div>
      </main>
    );
  } catch {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-black text-slate-950">We couldn’t load this game right now.</h1>
        <p className="mt-3 text-slate-600">Please go back and try again in a moment.</p>
        <div className="mt-5">
          <Link href="/" className="text-sm font-semibold text-slate-900 underline underline-offset-4">
            Back to home
          </Link>
        </div>
      </main>
    );
  }
}
