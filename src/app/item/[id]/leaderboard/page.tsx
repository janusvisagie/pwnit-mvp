// src/app/item/[id]/leaderboard/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/db";
import { dayKeyZA } from "@/lib/time";
import { getOrCreateDemoUser } from "@/lib/auth";
import { AliasEditor } from "@/components/AliasEditor";
import { BuyNowButton } from "@/components/BuyNowButton";

export const dynamic = "force-dynamic";

export default async function ItemLeaderboardPage({ params }: { params: { id: string } }) {
  const me = await getOrCreateDemoUser();
  const itemId = params.id;
  const dayKey = dayKeyZA();

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-extrabold">Item not found</h1>
        <div className="mt-3">
          <Link className="text-sm font-semibold text-slate-900 underline" href="/">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Winners (today)
  const winners = await prisma.winner.findMany({
    where: { itemId, dayKey },
    orderBy: [{ rank: "asc" }],
    take: 200,
    select: { userId: true, rank: true, scoreMs: true, alias: true },
  });
  const meWon = winners.some((w) => w.userId === me.id);

  // Live leaderboard (today): best per user
  const best = await prisma.attempt.groupBy({
    by: ["userId"],
    where: {
      itemId,
      dayKey,
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
    users.map((u) => [
      u.id,
      (u.alias && u.alias.trim()) || (u.email?.split("@")[0] ?? "Anonymous"),
    ])
  );

  const rows = best
    .filter((b) => typeof (b as any)._min?.scoreMs === "number")
    .map((b, idx) => ({
      rank: idx + 1,
      userId: b.userId,
      alias: aliasMap.get(b.userId) ?? "Anonymous",
      scoreMs: (b as any)._min.scoreMs as number,
      isMe: b.userId === me.id,
    }));

  const totalPlayers = rows.length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-extrabold text-slate-900">{item.title}</h1>
      <div className="mt-1 text-sm font-semibold text-slate-700">
        Live leaderboard • {dayKey}
      </div>

      <div className="mt-4 flex gap-3 text-sm">
        <Link className="font-semibold text-slate-900 underline" href={`/item/${item.id}`}>
          ← Item
        </Link>
        <Link className="font-semibold text-slate-900 underline" href={`/play/${item.id}`}>
          Play
        </Link>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <AliasEditor initialAlias={String((me as any).alias ?? "")} />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-extrabold text-slate-900">Live scores (best per player)</div>
        <div className="mt-1 text-xs text-slate-600">
          Lower ms is better • Players today: {totalPlayers}
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <div className="grid grid-cols-[80px_1fr_120px] bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-700">
            <div>Rank</div>
            <div>Player</div>
            <div className="text-right">Best (ms)</div>
          </div>

          {rows.length === 0 ? (
            <div className="px-3 py-3 text-sm text-slate-700">No scores yet today.</div>
          ) : (
            rows.map((r) => (
              <div
                key={r.userId}
                className="grid grid-cols-[80px_1fr_120px] border-t border-slate-200 px-3 py-2 text-sm text-slate-800"
              >
                <div className="font-semibold">#{r.rank}</div>
                <div className="font-semibold">
                  {r.alias} {r.isMe ? <span className="ml-2 text-xs text-slate-500">YOU</span> : null}
                </div>
                <div className="text-right font-semibold">{r.scoreMs}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {(item.state === "CLOSED" || item.state === "PUBLISHED") ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          {meWon ? (
            <div className="text-sm font-extrabold text-slate-900">
              You’re a winner — no need to buy.
            </div>
          ) : (
            <>
              <div className="text-sm font-extrabold text-slate-900">
                Didn’t win? Buy it by paying the difference.
              </div>
              <div className="mt-3">
                <BuyNowButton itemId={item.id} />
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
