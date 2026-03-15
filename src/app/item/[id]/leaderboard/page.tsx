import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/auth";
import { AliasEditor } from "@/components/AliasEditor";
import { CountdownChip } from "@/components/CountdownChip";
import { BuyNowButton } from "@/components/BuyNowButton";
import { compareScores, getGameMeta } from "@/lib/gameRules";

const INVALID_FLAG_FRAGMENT = '"valid":false';

function stateLabel(state: string) {
  if (state === "ACTIVATED") return "Live now";
  if (state === "PUBLISHED") return "Results published";
  if (state === "CLOSED") return "Closed";
  return "Open";
}

function rankTone(rank: number, isMe: boolean) {
  if (rank === 1) return "border-amber-300 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50";
  if (rank === 2) return "border-slate-300 bg-gradient-to-r from-slate-50 via-white to-slate-50";
  if (rank === 3) return "border-orange-200 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50";
  if (isMe) return "border-blue-300 bg-blue-50/80";
  return "border-slate-200 bg-white";
}

function rankBadgeTone(rank: number, isMe: boolean) {
  if (rank === 1) return "bg-gradient-to-br from-amber-400 to-amber-600 text-white ring-2 ring-amber-200";
  if (rank === 2) return "bg-gradient-to-br from-slate-300 to-slate-500 text-white ring-2 ring-slate-200";
  if (rank === 3) return "bg-gradient-to-br from-orange-400 to-orange-600 text-white ring-2 ring-orange-200";
  if (isMe) return "bg-blue-600 text-white ring-2 ring-blue-200";
  return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
}

export default async function ItemLeaderboardPage({ params }: { params: { id: string } }) {
  const me = await getOrCreateDemoUser();
  const itemId = params?.id;
  if (!itemId) notFound();

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) notFound();

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
    select: { userId: true, scoreMs: true, createdAt: true, paidUsed: true },
  });

  const bestByUser = new Map<
    string,
    { userId: string; scoreMs: number; createdAt: Date; paidUsed: number }
  >();

  for (const attempt of attempts) {
    const current = bestByUser.get(attempt.userId);
    if (!current || compareScores(item.gameKey, attempt, current) < 0) {
      bestByUser.set(attempt.userId, {
        userId: attempt.userId,
        scoreMs: attempt.scoreMs,
        createdAt: attempt.createdAt,
        paidUsed: Number(attempt.paidUsed ?? 0),
      });
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
          ? ((me as any).alias?.trim() || aliasMap.get(row.userId) || "Anonymous")
          : aliasMap.get(row.userId) || "Anonymous",
      scoreMs: row.scoreMs,
      paidUsed: row.paidUsed,
      isMe: row.userId === me.id,
    }));

  const myRow = rows.find((r) => r.userId === me.id) || null;
  const isPlayable = item.state === "OPEN" || item.state === "ACTIVATED";
  const podium = rows.slice(0, 3);

  return (
    <main className="mx-auto w-full max-w-6xl px-3 pb-8 pt-4 sm:px-4 sm:pb-10 sm:pt-6">
      <div className="space-y-4 sm:space-y-5">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 px-4 py-5 text-white sm:px-6 sm:py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/item/${itemId}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200 transition hover:text-white"
                >
                  <span aria-hidden="true">←</span>
                  Back to prize
                </Link>

                <div className="mt-3 space-y-1">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-200/90">Leaderboard</p>
                  <h1 className="text-2xl font-black leading-tight sm:text-3xl">{item.title}</h1>
                  <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
                    Live scores, best attempt per player, and a clear view of where you stand.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                {isPlayable ? (
                  <Link
                    href={`/play/${itemId}`}
                    className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950 shadow-sm transition hover:bg-slate-100"
                  >
                    Play now
                  </Link>
                ) : null}
                <Link
                  href={`/item/${itemId}`}
                  className="inline-flex items-center justify-center rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Prize page
                </Link>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-white/15">
                {stateLabel(item.state)}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-white/15">
                {meta.label}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-white/15">
                {meta.higherIsBetter ? "Higher score wins" : "Lower score wins"}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-white/15">
                {rows.length} {rows.length === 1 ? "player" : "players"}
              </span>
              {item.state === "ACTIVATED" && closesAtIso ? (
                <span className="rounded-full bg-rose-500/15 px-3 py-1.5 text-xs font-bold text-rose-100 ring-1 ring-rose-300/20">
                  Ends in <CountdownChip state={item.state} closesAt={closesAtIso} />
                </span>
              ) : null}
            </div>
          </div>

          {podium.length ? (
            <div className="grid gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-4 sm:px-6 md:grid-cols-3">
              {podium.map((entry) => (
                <div
                  key={entry.userId}
                  className={`rounded-2xl border px-4 py-3 shadow-sm ${rankTone(entry.rank, entry.isMe)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                        {entry.rank === 1 ? "Top spot" : `Rank #${entry.rank}`}
                      </p>
                      <p className="mt-1 truncate text-base font-black text-slate-900">{entry.alias}</p>
                    </div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black ${rankBadgeTone(entry.rank, entry.isMe)}`}>
                      {entry.rank}
                    </div>
                  </div>
                  <p className="mt-3 text-lg font-black text-slate-950">{meta.formatScore(entry.scoreMs)}</p>
                  {entry.isMe ? (
                    <p className="mt-1 text-xs font-semibold text-blue-700">This is your current best position.</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3 sm:px-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-950">Best scores</h2>
                  <p className="text-sm text-slate-600">
                    One best attempt per player, ranked using the live game rules.
                  </p>
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {meta.higherIsBetter ? "Highest first" : "Lowest first"}
                </p>
              </div>
            </div>

            {rows.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">🏁</div>
                <h3 className="mt-4 text-lg font-black text-slate-950">No scores yet</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Be the first to set the pace on this prize.
                </p>
                {isPlayable ? (
                  <Link
                    href={`/play/${itemId}`}
                    className="mt-5 inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                  >
                    Play first
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <div
                    key={row.userId}
                    className={`border-l-4 px-4 py-3 transition sm:px-5 sm:py-4 ${rankTone(row.rank, row.isMe)}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-black ${rankBadgeTone(row.rank, row.isMe)}`}>
                          #{row.rank}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-black text-slate-950 sm:text-base">{row.alias}</span>
                            {row.isMe ? (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-blue-700 ring-1 ring-blue-200">
                                You
                              </span>
                            ) : null}
                            {row.rank === 1 ? (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
                                Leading
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {row.paidUsed > 0
                              ? `${row.paidUsed} paid ${row.paidUsed === 1 ? "credit" : "credits"} used on best run`
                              : "Best valid attempt"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-black text-slate-950 sm:text-xl">{meta.formatScore(row.scoreMs)}</div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          rank #{row.rank}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Your position</p>
              {myRow ? (
                <>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-black text-white shadow-sm">
                      #{myRow.rank}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-600">Current best</p>
                      <p className="text-lg font-black text-slate-950">{meta.formatScore(myRow.scoreMs)}</p>
                    </div>
                  </div>
                  {isPlayable && !meWon ? (
                    <Link
                      href={`/play/${itemId}`}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                    >
                      Improve my score
                    </Link>
                  ) : null}
                </>
              ) : (
                <>
                  <p className="mt-3 text-sm text-slate-600">You have not posted a valid score on this item yet.</p>
                  {isPlayable ? (
                    <Link
                      href={`/play/${itemId}`}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                    >
                      Play now
                    </Link>
                  ) : null}
                </>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Leaderboard name</p>
              <p className="mt-2 text-sm text-slate-600">Choose the name other players will see.</p>
              <div className="mt-4">
                <AliasEditor initialAlias={((me as any).alias || "") as string} />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Scoring</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{meta.label}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{meta.description}</p>
              <p className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                {meta.higherIsBetter ? "Higher score is better." : "Lower score is better."} Ties are broken by the earlier run.
              </p>
            </section>

            {meWon ? (
              <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm sm:p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Winner</p>
                <h3 className="mt-2 text-lg font-black text-emerald-950">You won this prize</h3>
                <p className="mt-2 text-sm leading-6 text-emerald-800">
                  No purchase is needed for this item. Your top score secured the win.
                </p>
              </section>
            ) : (
              <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Still want it?</p>
                <h3 className="mt-2 text-lg font-black text-slate-950">Buy the prize after the round</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Your paid credits spent on this item reduce the buy-now price automatically.
                </p>
                <div className="mt-4">
                  <BuyNowButton
                    itemId={itemId}
                    className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                  >
                    View buy-now options
                  </BuyNowButton>
                </div>
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
