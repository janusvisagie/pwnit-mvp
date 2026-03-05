// src/app/play/[itemId]/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/db";
import GameHost from "./_components/GameHost";
import { CountdownChip } from "@/components/CountdownChip";
import { getOrCreateDemoUser } from "@/lib/auth";
import { playCostForPrize } from "@/lib/playCost";

export const dynamic = "force-dynamic";

export default async function PlayPage({ params }: { params: { itemId: string } }) {
  const itemId = params?.itemId;

  if (!itemId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="text-xl font-bold">Missing item id</div>
        <div className="mt-3">
          <Link className="text-sm font-semibold text-slate-900 underline" href="/">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const [me, item] = await Promise.all([
    getOrCreateDemoUser(),
    prisma.item.findUnique({ where: { id: itemId } }),
  ]);

  if (!item) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="text-xl font-bold">Item not found</div>
        <div className="mt-3">
          <Link className="text-sm font-semibold text-slate-900 underline" href="/">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const isPlayable = item.state === "OPEN" || item.state === "ACTIVATED";
  if (!isPlayable) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="text-xl font-bold">This item is no longer playable.</div>
        <div className="mt-2 text-slate-700">Results are available on the leaderboard.</div>
        <div className="mt-4 flex gap-3">
          <Link className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white" href={`/item/${item.id}/leaderboard`}>
            View results
          </Link>
          <Link className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900" href="/">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const closesAtIso = item.closesAt ? item.closesAt.toISOString() : null;
  const playCost = playCostForPrize(item.prizeValueZAR);

  const free = Number((me as any).freeCreditsBalance ?? 0);
  const paid = Number((me as any).paidCreditsBalance ?? 0);
  const creditsTotal = free + paid;

  const gameKey =
    (item.gameKey as any) ??
    (item.prizeType?.toLowerCase() === "voucher" ? "rhythm-hold" : "precision-timer");

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-slate-900">{item.title}</h1>

        {item.state === "ACTIVATED" && closesAtIso ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Ends in</span>
            <CountdownChip closesAtIso={closesAtIso} labelWhenClosed="Closed" />
          </div>
        ) : null}
      </div>

      <div className="mt-2 text-sm text-slate-700">
        Play costs <span className="font-semibold text-slate-900">{playCost}</span>{" "}
        {playCost === 1 ? "credit" : "credits"}.
      </div>

      <div className="mt-4 flex gap-3 text-sm">
        <Link className="font-semibold text-slate-900 underline" href={`/item/${item.id}`}>
          Item
        </Link>
        <Link className="font-semibold text-slate-900 underline" href={`/item/${item.id}/leaderboard`}>
          Leaderboard
        </Link>
      </div>

      <div className="mt-5">
        <GameHost itemId={item.id} gameKey={gameKey} playCost={playCost} credits={creditsTotal} />
      </div>
    </div>
  );
}
