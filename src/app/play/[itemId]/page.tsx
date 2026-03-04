// src/app/play/[itemId]/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/db";
import GameHost from "./_components/GameHost";
import { CountdownChip } from "@/components/CountdownChip";
import { getOrCreateDemoUser } from "@/lib/auth";
import { playCostForPrize } from "@/lib/playCost";

export default async function PlayPage({ params }: { params: { itemId: string } }) {
  const itemId = params?.itemId;

  if (!itemId) {
    return (
      <main className="mx-auto max-w-3xl space-y-3 p-4">
        <div className="text-lg font-bold">Missing item id</div>
        <Link className="text-sm font-semibold hover:underline" href="/">
          ← Back to Home
        </Link>
      </main>
    );
  }

  const [me, item] = await Promise.all([getOrCreateDemoUser(), prisma.item.findUnique({ where: { id: itemId } })]);

  if (!item) {
    return (
      <main className="mx-auto max-w-3xl space-y-3 p-4">
        <div className="text-lg font-bold">Item not found</div>
        <Link className="text-sm font-semibold hover:underline" href="/">
          ← Back to Home
        </Link>
      </main>
    );
  }

  // Prevent playing once closed/published
  const isPlayable = item.state === "OPEN" || item.state === "ACTIVATED";
  if (!isPlayable) {
    return (
      <main className="mx-auto max-w-3xl space-y-3 p-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-extrabold text-slate-900">This item is no longer playable.</div>
          <div className="mt-1 text-sm text-slate-600">Results are available on the leaderboard.</div>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white" href={`/item/${itemId}/leaderboard`}>
              View results
            </Link>
            <Link className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900" href="/">
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const closesAtIso = item.closesAt ? item.closesAt.toISOString() : null;

  const playCost = playCostForPrize(item.prizeValueZAR);

  const free = Number((me as any).freeCreditsBalance ?? 0);
  const paid = Number((me as any).paidCreditsBalance ?? 0);
  const creditsTotal = free + paid;

  return (
    <main className="mx-auto max-w-3xl space-y-3 p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-2xl font-extrabold tracking-tight">{item.title}</div>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
            <span>
              Play costs <span className="font-semibold text-slate-900">{playCost}</span>{" "}
              {playCost === 1 ? "credit" : "credits"}
            </span>
            <CountdownChip state={item.state} closesAt={closesAtIso} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link className="text-sm font-semibold text-slate-900 hover:underline" href="/">
            Home
          </Link>
          <Link className="text-sm font-semibold text-slate-900 hover:underline" href={`/item/${item.id}`}>
            Item
          </Link>
          <Link className="text-sm font-semibold text-slate-900 hover:underline" href={`/item/${item.id}/leaderboard`}>
            Leaderboard
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <GameHost itemId={item.id} gameKey={(item.gameKey as any) ?? "precision-timer"} playCost={playCost} credits={creditsTotal} />
      </div>

      <div className="text-xs text-slate-600">
        Credits: <span className="font-semibold text-slate-900">{creditsTotal}</span>{" "}
        <span className="text-slate-500">(free {free} + paid {paid})</span>
      </div>
    </main>
  );
}
