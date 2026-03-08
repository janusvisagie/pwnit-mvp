import Link from "next/link";
import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/auth";
import { AliasEditor } from "@/components/AliasEditor";
import { CountdownChip } from "@/components/CountdownChip";
import { BuyNowButton } from "@/components/BuyNowButton";
import { compareScores, getGameMeta } from "@/lib/gameRules";
import { syncRoundLifecycle } from "@/lib/rounds";

export default async function ItemLeaderboardPage({ params }: { params: { id: string } }) {
  const me = await getOrCreateDemoUser();
  const itemId = params.id;

  await syncRoundLifecycle(itemId);

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { rounds: { orderBy: [{ sequence: "desc" }], take: 1 } },
  });

  if (!item) {
    return (
      <main className="mx-auto max-w-3xl space-y-3 p-4">
        <h1 className="text-xl font-extrabold">Item not found</h1>
        <Link className="text-sm font-semibold text-slate-900 hover:underline" href="/">
          ← Back to Home
        </Link>
      </main>
    );
  }

  const round = item.rounds[0] ?? null;
  const closesAtIso = (round?.closesAt ?? item.closesAt)?.toISOString?.() ?? null;
  const gameMeta = getGameMeta(item.gameKey);

  const winners = round
    ? await prisma.winner.findMany({
        where: { roundId: round.id },
        orderBy: [{ rank: "asc" }],
        select: { userId: true, rank: true, scoreMs: true, alias: true, rewardType: true, rewardCredits: true },
      })
    : [];

  const meWon = winners.some((w) => w.userId === me.id && w.rank === 1 && w.rewardType === "ITEM");

  const attempts = round
    ? await prisma.attempt.findMany({
        where: {
          roundId: round.id,
          OR: [{ flags: null }, { NOT: { flags: { contains: '"valid":false' } } }],
        },
        orderBy: [{ createdAt: "asc" }],
        select: { userId: true, scoreMs: true, createdAt: true },
      })
    : [];

  const bestByUser = new Map<string, { userId: string; scoreMs: number; createdAt: Date }>();
  for (const attempt of attempts) {
    const current = bestByUser.get(attempt.userId);
    if (!current || compareScores(item.gameKey, attempt, current) < 0) bestByUser.set(attempt.userId, attempt);
  }

  const bestRows = Array.from(bestByUser.values()).sort((a, b) => compareScores(item.gameKey, a, b));
  const userIds = bestRows.map((b) => b.userId);
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, alias: true, email: true },
      })
    : [];
  const aliasMap = new Map(users.map((u) => [u.id, (u.alias && u.alias.trim()) || (u.email?.split("@")[0] ?? "Anonymous")]));

  const rows = bestRows.map((b, idx) => ({
    rank: idx + 1,
    userId: b.userId,
    alias: aliasMap.get(b.userId) ?? "Anonymous",
    scoreMs: b.scoreMs,
    isMe: b.userId === me.id,
  }));

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold leading-tight">{item.title}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
            <span>{gameMeta.label} leaderboard</span>
            {closesAtIso ? <CountdownChip state={round?.state ?? item.state} closesAt={closesAtIso} /> : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link className="text-sm font-semibold text-slate-900 hover:underline" href={`/item/${itemId}`}>
            ← Item
          </Link>
          {round && ["BUILDING", "ACTIVATED"].includes(round.state) ? (
            <Link className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-slate-800" href={`/play/${itemId}`}>
              Play
            </Link>
          ) : null}
        </div>
      </div>

      <AliasEditor initialAlias={(me as any).alias ?? "PwnIt_0000"} />

      {winners.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-extrabold text-slate-900">Published rewards</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {winners.map((winner) => (
              <div key={`${winner.userId}-${winner.rank}`} className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">#{winner.rank}</div>
                <div className="mt-1 text-sm font-extrabold text-slate-900">{winner.alias}</div>
                <div className="mt-1 text-sm text-slate-700">{gameMeta.formatScore(winner.scoreMs)}</div>
                <div className="mt-2 text-xs font-semibold text-slate-600">
                  {winner.rank === 1 ? "Wins the prize" : `Wins ${winner.rewardCredits} credit${winner.rewardCredits === 1 ? "" : "s"}`}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="font-extrabold">Live scores (best per player)</div>
          <div className="text-xs text-slate-600">Higher score is better • Players: <span className="font-semibold text-slate-900">{rows.length}</span></div>
        </div>

        <div className="grid grid-cols-[80px_1fr_140px] px-4 py-2 text-xs font-bold text-slate-600">
          <div>Rank</div>
          <div>Player</div>
          <div className="text-right">Best score</div>
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-4 text-sm text-slate-600">No scores yet.</div>
        ) : (
          rows.map((r) => (
            <div key={r.userId} className={["grid grid-cols-[80px_1fr_140px] items-center border-t border-slate-100 px-4 py-3", r.isMe ? "bg-slate-50" : ""].join(" ")}>
              <div className="font-semibold">#{r.rank}</div>
              <div className="font-semibold text-slate-900">{r.alias}{r.isMe ? <span className="ml-2 rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-extrabold text-white">YOU</span> : null}</div>
              <div className="text-right font-semibold">{gameMeta.formatScore(r.scoreMs)}</div>
            </div>
          ))
        )}
      </section>

      {round?.state === "FAILED" || round?.state === "REFUNDED" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          This prize did not go live in time. Paid credits used on this prize have been returned to your wallet.
        </section>
      ) : meWon ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-sm font-semibold text-emerald-900">🎉 You won this item. No purchase needed.</div>
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-extrabold text-slate-900">Didn’t win? Buy it by paying the difference.</div>
          <div className="mt-1 text-sm text-slate-600">Paid plays on this prize build your discount automatically.</div>
          <div className="mt-3">
            <BuyNowButton itemId={itemId} />
          </div>
        </section>
      )}
    </main>
  );
}
