import Link from "next/link";
import { prisma } from "@/lib/db";
import GameHost from "./_components/GameHost";
import { CountdownChip } from "@/components/CountdownChip";
import { getOrCreateDemoUser } from "@/lib/auth";
import { playCostForPrize } from "@/lib/playCost";
import { ensureCurrentRound } from "@/lib/rounds";

export default async function PlayPage({ params }: { params: { itemId: string } }) {
  const itemId = params?.itemId;
  if (!itemId) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white shadow-2xl backdrop-blur">
          <div className="text-lg font-semibold">Missing item id</div>
          <Link href="/" className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900">
            ← Back to Home
          </Link>
        </div>
      </main>
    );
  }

  try {
    const [me, item] = await Promise.all([
      getOrCreateDemoUser(),
      prisma.item.findUnique({ where: { id: itemId } }),
    ]);

    if (!item) {
      return (
        <main className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white shadow-2xl backdrop-blur">
            <div className="text-lg font-semibold">Item not found</div>
            <Link href="/" className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900">
              ← Back to Home
            </Link>
          </div>
        </main>
      );
    }

    const round = await ensureCurrentRound(item.id);
    const roundState = String(round?.state || "").toUpperCase();
    const isPlayable = roundState === "BUILDING" || roundState === "ACTIVATED";

    if (!isPlayable) {
      return (
        <main className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4">
          <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white shadow-2xl backdrop-blur">
            <div className="text-lg font-semibold">This item is not accepting plays right now.</div>
            <p className="mt-2 text-sm text-white/70">Please check the leaderboard or return to the item page.</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Link href={`/item/${item.id}/leaderboard`} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900">
                View results
              </Link>
              <Link href={`/item/${item.id}`} className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white/90">
                Back to item
              </Link>
            </div>
          </div>
        </main>
      );
    }

    const closesAtIso = round?.closesAt ? new Date(round.closesAt).toISOString() : item.closesAt ? item.closesAt.toISOString() : null;
    const countdownState = roundState === "ACTIVATED" ? "ACTIVATED" : null;
    const playCost = playCostForPrize(item.prizeValueZAR);
    const free = Number((me as any).freeCreditsBalance ?? 0);
    const paid = Number((me as any).paidCreditsBalance ?? 0);
    const creditsTotal = free + paid;

    return (
      <main className="mx-auto max-w-5xl px-4 pb-8 pt-4 text-white">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-xl backdrop-blur">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">{item.title}</h1>
            <div className="mt-1 text-sm text-white/75">
              Play costs {playCost} credits · You have {creditsTotal} credits
            </div>
          </div>
          {closesAtIso ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-sm font-semibold text-emerald-200">
              <span>Ends in</span>
              <CountdownChip state={countdownState} closesAt={closesAtIso} />
            </div>
          ) : null}
        </div>

        <div className="mb-4 flex items-center gap-2 text-sm text-white/80">
          <Link href={`/item/${item.id}`} className="rounded-xl border border-white/15 px-3 py-1.5 hover:bg-white/10">
            Item
          </Link>
          <Link href={`/item/${item.id}/leaderboard`} className="rounded-xl border border-white/15 px-3 py-1.5 hover:bg-white/10">
            Leaderboard
          </Link>
        </div>

        <GameHost itemId={item.id} gameKey={item.gameKey ?? undefined} playCost={playCost} />
      </main>
    );
  } catch {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white shadow-2xl backdrop-blur">
          <div className="text-lg font-semibold">We couldn’t load this game right now.</div>
          <p className="mt-2 text-sm text-white/70">Please go back and try again in a moment.</p>
          <Link href="/" className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900">
            Back to home
          </Link>
        </div>
      </main>
    );
  }
}
