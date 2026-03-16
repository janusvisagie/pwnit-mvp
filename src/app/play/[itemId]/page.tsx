import type { ReactNode } from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/auth";
import { CountdownChip } from "@/components/CountdownChip";
import { playCostForPrize } from "@/lib/playCost";
import { ROUND_STATES, syncRoundLifecycle } from "@/lib/rounds";
import GameHost from "./_components/GameHost";

function shell(children: ReactNode) {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-4xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      {children}
    </main>
  );
}

export default async function PlayPage({ params }: { params: { itemId: string } }) {
  const itemId = params?.itemId;
  if (!itemId) {
    return shell(
      <>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Missing item id</h1>
        </div>
        <Link href="/" className="text-sm font-semibold text-slate-700 underline-offset-4 hover:underline">
          ← Back to Home
        </Link>
      </>,
    );
  }

  try {
    const [me, item] = await Promise.all([
      getOrCreateDemoUser(),
      prisma.item.findUnique({ where: { id: itemId } }),
    ]);

    if (!item) {
      return shell(
        <>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-xl font-bold text-slate-900">Item not found</h1>
          </div>
          <Link href="/" className="text-sm font-semibold text-slate-700 underline-offset-4 hover:underline">
            ← Back to Home
          </Link>
        </>,
      );
    }

    const round = await syncRoundLifecycle(itemId);
    const roundPlayable = round?.state === ROUND_STATES.BUILDING || round?.state === ROUND_STATES.ACTIVATED;

    if (!roundPlayable) {
      return shell(
        <>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-black text-slate-900">This item is not accepting plays right now.</h1>
            <p className="mt-3 text-sm text-slate-600">Please check the leaderboard or go back to the item page.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/item/${itemId}/leaderboard`}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
            >
              View results
            </Link>
            <Link
              href={`/item/${itemId}`}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
            >
              Back to item
            </Link>
          </div>
        </>,
      );
    }

    const closesAtIso = round?.closesAt ? round.closesAt.toISOString() : null;
    const playCost = playCostForPrize(item.prizeValueZAR);
    const free = Number((me as any).freeCreditsBalance ?? 0);
    const paid = Number((me as any).paidCreditsBalance ?? 0);
    const creditsTotal = free + paid;
    const gameKey = (item.gameKey || "quick-stop") as any;

    return shell(
      <>
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">{item.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span>Play costs {playCost} credits</span>
                {closesAtIso ? (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="inline-flex items-center gap-2">
                      <span>Ends in</span>
                      <CountdownChip iso={closesAtIso} />
                    </span>
                  </>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/item/${itemId}`} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
                Item
              </Link>
              <Link
                href={`/item/${itemId}/leaderboard`}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Leaderboard
              </Link>
            </div>
          </div>
        </section>

        <GameHost itemId={itemId} gameKey={gameKey} playCost={playCost} credits={creditsTotal} />
      </>,
    );
  } catch {
    return shell(
      <>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">We couldn’t load this game right now.</h1>
          <p className="mt-3 text-sm text-slate-600">Please go back and try again in a moment.</p>
        </div>
        <Link href="/" className="text-sm font-semibold text-slate-700 underline-offset-4 hover:underline">
          Back to home
        </Link>
      </>,
    );
  }
}
