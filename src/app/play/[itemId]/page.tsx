import Link from "next/link";
import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/auth";
import { CountdownChip } from "@/components/CountdownChip";
import GameHost from "./_components/GameHost";
import { getGameMeta } from "@/lib/gameRules";
import { syncRoundLifecycle } from "@/lib/rounds";

export default async function PlayPage({ params }: { params: { itemId: string } }) {
  const itemId = params.itemId;
  const me = await getOrCreateDemoUser();

  await syncRoundLifecycle(itemId);

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { rounds: { orderBy: [{ sequence: "desc" }], take: 1 } },
  });
  if (!item) {
    return (
      <main className="mx-auto max-w-3xl space-y-3 p-4">
        <h1 className="text-xl font-extrabold">Item not found</h1>
        <Link className="text-sm font-semibold hover:underline" href="/">
          ← Back to Home
        </Link>
      </main>
    );
  }

  const round = item.rounds[0] ?? null;
  const isPlayable = round ? ["BUILDING", "ACTIVATED"].includes(round.state) : item.state === "OPEN" || item.state === "ACTIVATED";
  if (!isPlayable) {
    return (
      <main className="mx-auto max-w-3xl space-y-3 p-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-extrabold text-slate-900">This prize is no longer playable.</div>
          <div className="mt-1 text-sm text-slate-600">Results are available on the leaderboard.</div>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white" href={`/item/${itemId}/leaderboard`}>
              View results
            </Link>
            <Link className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900" href={`/item/${itemId}`}>
              Back to item
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const closesAtIso = (round?.closesAt ?? item.closesAt)?.toISOString?.() ?? null;
  const playCost = item.playCostCredits;
  const free = Number((me as any).freeCreditsBalance ?? 0);
  const paid = Number((me as any).paidCreditsBalance ?? 0);
  const creditsTotal = free + paid;
  const gameMeta = getGameMeta(item.gameKey);

  return (
    <main className="mx-auto max-w-5xl space-y-2 p-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xl font-extrabold tracking-tight sm:text-2xl">{item.title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span>{gameMeta.label}</span>
            <span>
              Play costs <span className="font-semibold text-slate-900">{playCost}</span> {playCost === 1 ? "credit" : "credits"}
            </span>
            {closesAtIso ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200">
                <span>Ends in</span>
                <CountdownChip state={round?.state ?? item.state} closesAt={closesAtIso} />
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link className="text-sm font-semibold text-slate-900 hover:underline" href={`/item/${item.id}`}>
            Item
          </Link>
          <Link className="text-sm font-semibold text-slate-900 hover:underline" href={`/item/${item.id}/leaderboard`}>
            Leaderboard
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:p-3">
        <GameHost itemId={item.id} gameKey={(item.gameKey as any) ?? "tap-speed"} playCost={playCost} credits={creditsTotal} />
      </div>
    </main>
  );
}
