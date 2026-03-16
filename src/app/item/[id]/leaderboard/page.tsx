import Link from "next/link";
import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/auth";
import { AliasEditor } from "@/components/AliasEditor";
import { CountdownChip } from "@/components/CountdownChip";
import { BuyNowButton } from "@/components/BuyNowButton";
import { compareScores, getGameMeta } from "@/lib/gameRules";

const INVALID_FLAG_FRAGMENT = '"valid":false';

export default async function ItemLeaderboardPage({
  params,
}: {
  params: { id: string };
}) {
  const me = await getOrCreateDemoUser();
  const itemId = params.id;

  const item = await prisma.item.findUnique({ where: { id: itemId } });

  if (!item) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Item not found</h1>
          <Link
            href="/"
            className="mt-4 inline-flex items-center text-sm font-semibold text-cyan-700 hover:text-cyan-800"
          >
            ← Back to home
          </Link>
        </div>
      </main>
    );
  }

  const closesAtIso = item.closesAt ? item.closesAt.toISOString() : null;
  const meta = getGameMeta(item.gameKey);

  const winners = await prisma.winner.findMany({
    where: { itemId },
    orderBy: [{ rank: "asc" }],
    take: 200,
    select: { userId: true, rank: true, scoreMs: true, alias: true },
  });

  const meWon = winners.some((w) => w.userId === me.id);

  const attempts = await prisma.attempt.findMany({
    where: {
      itemId,
      OR: [{ flags: null }, { NOT: { flags: { contains: INVALID_FLAG_FRAGMENT } } }],
    },
    orderBy: [{ createdAt: "asc" }],
    select: { userId: true, scoreMs: true, createdAt: true },
  });

  const bestByUser = new Map<string, (typeof attempts)[number]>();
  for (const attempt of attempts) {
    const current = bestByUser.get(attempt.userId);
    if (!current || compareScores(item.gameKey, attempt, current) < 0) {
      bestByUser.set(attempt.userId, attempt);
    }
  }

  const userIds = Array.from(bestByUser.keys());
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, alias: true, email: true },
      })
    : [];

  const aliasMap = new Map(
    users.map((u) => [u.id, (u.alias && u.alias.trim()) || (u.email?.split("@")[0] ?? "Anonymous")]),
  );

  const rows = Array.from(bestByUser.values())
    .sort((a, b) => compareScores(item.gameKey, a, b))
    .map((row, idx) => ({
      rank: idx + 1,
      userId: row.userId,
      alias:
        row.userId === me.id
          ? (me as any).alias?.trim() || aliasMap.get(row.userId) || "Anonymous"
          : aliasMap.get(row.userId) || "Anonymous",
      scoreMs: row.scoreMs,
      isMe: row.userId === me.id,
    }));

  const myRow = rows.find((row) => row.isMe);
  const canPlay = item.state === "OPEN" || item.state === "ACTIVATED";
  const stateLabel = (item.state || "OPEN").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-cyan-700">
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1">
                  Live leaderboard
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                  {stateLabel}
                </span>
              </div>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                {item.title}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Best score per player. {meta.higherIsBetter ? "Higher" : "Lower"} score wins.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/item/${item.id}`}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                ← Item
              </Link>
              {canPlay ? (
                <Link
                  href={`/play/${item.id}`}
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  Play
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 font-semibold text-slate-700">
              Players: <span className="font-black text-slate-900">{rows.length}</span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 font-semibold text-slate-700">
              Ranking: <span className="font-black text-slate-900">{meta.higherIsBetter ? "Higher is better" : "Lower is better"}</span>
            </div>
            {item.state === "ACTIVATED" && closesAtIso ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 font-semibold text-slate-700">
                <span className="mr-2">Ends in</span>
                <CountdownChip state={item.state} closesAt={closesAtIso} />
              </div>
            ) : null}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">Live scores</h2>
                <p className="mt-1 text-sm text-slate-600">Each player&apos;s best score is shown.</p>
              </div>
            </div>

            {rows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
                <div className="text-base font-bold text-slate-900">No scores yet</div>
                <p className="mt-2 text-sm text-slate-600">Be the first to play and set the pace.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rows.map((row) => {
                  const isTop3 = row.rank <= 3;
                  return (
                    <div
                      key={row.userId}
                      className={[
                        "grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm",
                        row.isMe
                          ? "border-cyan-300 bg-cyan-50/70"
                          : isTop3
                            ? "border-slate-200 bg-slate-50"
                            : "border-slate-200 bg-white",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={[
                            "flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black",
                            row.isMe
                              ? "bg-cyan-600 text-white"
                              : isTop3
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-700",
                          ].join(" ")}
                        >
                          #{row.rank}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-slate-900 sm:text-base">
                          {row.alias}
                          {row.isMe ? (
                            <span className="ml-2 rounded-full border border-cyan-200 bg-white px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-cyan-700">
                              You
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="text-right text-sm font-black text-slate-900 sm:text-base">
                        {meta.formatScore(row.scoreMs)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black tracking-tight text-slate-900">Your standing</h2>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
                    Position
                  </div>
                  <div className="mt-1 text-2xl font-black text-slate-900">
                    {myRow ? `#${myRow.rank}` : "—"}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
                    Best score
                  </div>
                  <div className="mt-1 text-lg font-black text-slate-900">
                    {myRow ? meta.formatScore(myRow.scoreMs) : "No score yet"}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black tracking-tight text-slate-900">Leaderboard name</h2>
              <p className="mt-2 text-sm text-slate-600">
                Choose the name other players see on the leaderboard.
              </p>
              <div className="mt-4">
                <AliasEditor initialAlias={(me as any).alias || ""} />
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              {meWon ? (
                <>
                  <h2 className="text-lg font-black tracking-tight text-slate-900">You won this item</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Nice one. No purchase is needed for this prize.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-black tracking-tight text-slate-900">Didn&apos;t win?</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Buy it by paying the difference. Your paid credits spent playing this item count as your discount.
                  </p>
                  <div className="mt-4">
                    <BuyNowButton
                      itemId={item.id}
                      className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white hover:bg-slate-800"
                    >
                      See buy options
                    </BuyNowButton>
                  </div>
                </>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
