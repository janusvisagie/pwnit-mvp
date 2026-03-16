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
      <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4 py-10">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Missing item id</h1>
          <div className="mt-6">
            <Link href="/" className="text-sm font-medium text-slate-700 underline-offset-4 hover:underline">
              ← Back to Home
            </Link>
          </div>
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
        <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4 py-10">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-semibold text-slate-900">Item not found</h1>
            <div className="mt-6">
              <Link href="/" className="text-sm font-medium text-slate-700 underline-offset-4 hover:underline">
                ← Back to Home
              </Link>
            </div>
          </div>
        </main>
      );
    }

    const round = await ensureCurrentRound(item.id);
    const roundState = String(round?.state || "").toUpperCase();
    const isPlayable = roundState === "BUILDING" || roundState === "ACTIVATED";

    if (!isPlayable) {
      return (
        <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4 py-10">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-semibold text-slate-900">This item is not accepting plays right now.</h1>
            <p className="mt-3 text-sm text-slate-600">
              Please check the leaderboard or return to the item page.
            </p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <Link
                href={`/item/${item.id}/leaderboard`}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                View results
              </Link>
              <Link
                href={`/item/${item.id}`}
                className="text-sm font-medium text-slate-700 underline-offset-4 hover:underline"
              >
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
        ? item.closesAt.toISOString()
        : null;
    const countdownState = roundState === "ACTIVATED" ? "ACTIVATED" : null;
    const playCost = playCostForPrize(item.prizeValueZAR);
    const free = Number((me as any).freeCreditsBalance ?? 0);
    const paid = Number((me as any).paidCreditsBalance ?? 0);
    const creditsTotal = free + paid;

    return (
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">{item.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span>Play costs {playCost} credits</span>
            <span>·</span>
            <span>You have {creditsTotal} credits</span>
            {closesAtIso ? (
              <span className="inline-flex items-center gap-2">
                <span>Ends in</span>
                <CountdownChip state={countdownState} closesAt={closesAtIso} />
              </span>
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Link href={`/item/${item.id}`} className="text-sm font-medium text-slate-700 underline-offset-4 hover:underline">
              Item
            </Link>
            <Link
              href={`/item/${item.id}/leaderboard`}
              className="text-sm font-medium text-slate-700 underline-offset-4 hover:underline"
            >
              Leaderboard
            </Link>
          </div>
        </div>

        <GameHost
          itemId={item.id}
          gameKey={(item.gameKey as any) || "quick-stop"}
          playCost={playCost}
          credits={creditsTotal}
        />
      </main>
    );
  } catch {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4 py-10">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">We couldn’t load this game right now.</h1>
          <p className="mt-3 text-sm text-slate-600">Please go back and try again in a moment.</p>
          <div className="mt-6">
            <Link href="/" className="text-sm font-medium text-slate-700 underline-offset-4 hover:underline">
              Back to home
            </Link>
          </div>
        </div>
      </main>
    );
  }
}
