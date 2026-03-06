import Link from "next/link";
import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/auth";
import { AliasEditor } from "@/components/AliasEditor";
import { CountdownChip } from "@/components/CountdownChip";
import { BuyNowButton } from "@/components/BuyNowButton";

export default async function ItemLeaderboardPage({ params }: { params: { id: string } }) {
  const me = await getOrCreateDemoUser();
  const itemId = params.id;

  const item = await prisma.item.findUnique({ where: { id: itemId } });
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

  const closesAtIso = item.closesAt ? item.closesAt.toISOString() : null;

  const winners = await prisma.winner.findMany({
    where: { itemId },
    orderBy: [{ rank: "asc" }],
    take: 200,
    select: { userId: true, rank: true, scoreMs: true, alias: true },
  });
  const meWon = winners.some((w) => w.userId === me.id);

  const best = await prisma.attempt.groupBy({
    by: ["userId"],
    where: {
      itemId,
      OR: [{ flags: null }, { NOT: { flags: { contains: '"valid":false' } } }],
    },
    _min: { scoreMs: true },
    orderBy: { _min: { scoreMs: "asc" } },
    take: 100,
  });

  const userIds = best.map((b) => b.userId);
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, alias: true, email: true },
      })
    : [];

  const aliasMap = new Map(
    users.map((u) => [u.id, (u.alias && u.alias.trim()) || (u.email?.split("@")[0] ?? "Anonymous")])
  );

  const rows = best
    .filter((b) => typeof b._min.scoreMs === "number")
    .map((b, idx) => ({
      rank: idx + 1,
      userId: b.userId,
      alias: aliasMap.get(b.userId) ?? "Anonymous",
      scoreMs: b._min.scoreMs as number,
      isMe: b.userId === me.id,
    }));

  const totalPlayers = rows.length;

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold leading-tight">{item.title}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
            <span>Live leaderboard</span>
            <CountdownChip state={item.state} closesAt={closesAtIso} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link className="text-sm font-semibold text-slate-900 hover:underline" href={`/item/${itemId}`}>
            ← Item
          </Link>
          <Link className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-slate-800" href={`/play/${itemId}`}>
            Play
          </Link>
        </div>
      </div>

      <AliasEditor initialAlias={(me as any).alias ?? "PwnIt_0000"} />

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="font-extrabold">Live scores (best per player)</div>
          <div className="text-xs text-slate-600">Lower ms is better • Players: <span className="font-semibold text-slate-900">{totalPlayers}</span></div>
        </div>

        <div className="grid grid-cols-[80px_1fr_110px] px-4 py-2 text-xs font-bold text-slate-600">
          <div>Rank</div>
          <div>Player</div>
          <div className="text-right">Best (ms)</div>
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-4 text-sm text-slate-600">No scores yet.</div>
        ) : (
          rows.map((r) => (
            <div
              key={r.userId}
              className={[
                "grid grid-cols-[80px_1fr_110px] items-center border-t border-slate-100 px-4 py-3",
                r.rank === 1 ? "bg-amber-50" : "",
                r.isMe ? "ring-inset ring-1 ring-slate-200" : "",
              ].join(" ")}
            >
              <div className="font-semibold">#{r.rank}</div>
              <div className="font-semibold text-slate-900">
                {r.alias}
                {r.isMe ? <span className="ml-2 rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-extrabold text-white">YOU</span> : null}
                {r.rank === 1 ? <span className="ml-2 rounded-full bg-amber-300 px-2 py-0.5 text-[11px] font-extrabold text-slate-900">WINNING</span> : null}
              </div>
              <div className="text-right font-semibold tabular-nums">{r.scoreMs}</div>
            </div>
          ))
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        {meWon ? (
          <div className="text-sm font-semibold text-slate-900">🎉 You&apos;re a winner — no need to buy.</div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm font-extrabold text-slate-900">Didn&apos;t win? Buy it by paying the difference.</div>
            <BuyNowButton itemId={itemId} />
          </div>
        )}
      </section>
    </main>
  );
}
