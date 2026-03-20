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

function formatZAR(v: number) {
  return `R${Number(v || 0).toLocaleString("en-ZA")}`;
}

export default async function PlayPage({ params }: { params: { itemId: string } }) {
  noStore();

  const itemId = params?.itemId;
  if (!itemId) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-center sm:px-6">
        <h1 className="text-2xl font-black text-slate-950">Missing item id</h1>
        <div className="mt-6">
          <Link href="/" className="inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white">
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
        <main className="mx-auto max-w-3xl px-4 py-10 text-center sm:px-6">
          <h1 className="text-2xl font-black text-slate-950">Item not found</h1>
          <div className="mt-6">
            <Link href="/" className="inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white">
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
    const closesAtIso = round?.closesAt ? new Date(round.closesAt).toISOString() : item.closesAt ? item.closesAt.toISOString() : null;
    const countdownState = roundState === ROUND_STATES.ACTIVATED ? "ACTIVATED" : null;
    const playCost = playCostForPrize(item.prizeValueZAR);
    const free = Number((actor.user as any).freeCreditsBalance ?? 0);
    const paid = Number((actor.user as any).paidCreditsBalance ?? 0);
    const creditsTotal = free + paid;

    if (!isPlayable) {
      return (
        <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <h1 className="text-2xl font-black text-slate-950">This item is not accepting plays right now.</h1>
            <p className="mt-3 text-slate-600">Please check the leaderboard or return to the item page.</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/item/${item.id}/leaderboard`}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                View leaderboard
              </Link>
              <Link
                href={`/item/${item.id}`}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-extrabold text-white hover:bg-slate-800"
              >
                Back to item
              </Link>
            </div>
          </div>
        </main>
      );
    }

    return (
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{item.title}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                    Prize {formatZAR(item.prizeValueZAR)}
                  </span>
                  <span className="rounded-full bg-sky-50 px-3 py-1 font-semibold text-sky-700">
                    {playCost} credits / play
                  </span>
                  <span className="rounded-full bg-violet-50 px-3 py-1 font-semibold text-violet-700">
                    Credits {creditsTotal}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                {closesAtIso && countdownState ? <CountdownChip closesAt={closesAtIso} state={countdownState} /> : null}
                <Link
                  href={`/item/${item.id}/leaderboard`}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  View leaderboard
                </Link>
                <Link
                  href={`/item/${item.id}`}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Back to item
                </Link>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <GameHost
              itemId={item.id}
              gameKey={((item.gameKey as any) || "quick-stop") as any}
              playCost={playCost}
              credits={creditsTotal}
            />
          </section>
        </div>
      </main>
    );
  } catch {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-center sm:px-6">
        <h1 className="text-2xl font-black text-slate-950">We couldn’t load this game right now.</h1>
        <p className="mt-3 text-slate-600">Please go back and try again in a moment.</p>
        <div className="mt-6">
          <Link href="/" className="inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-extrabold text-white">
            Back to home
          </Link>
        </div>
      </main>
    );
  }
}
