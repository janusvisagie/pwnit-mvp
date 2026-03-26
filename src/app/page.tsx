import { unstable_noStore as noStore } from "next/cache";

import { AutoRefreshActivated } from "@/components/AutoRefreshActivated";
import { ItemCard } from "@/components/ItemCard";
import { WelcomeModal } from "@/components/WelcomeModal";
import { prisma } from "@/lib/db";
import { activationProgress, activationTargetPaidCredits, playCostForPrize } from "@/lib/playCost";
import { settleItemWinners } from "@/lib/settle";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type HomeItem = Awaited<ReturnType<typeof prisma.item.findMany>>[number];

async function syncItemState(item: HomeItem, now: Date, paidSpent: number, winnerCount: number) {
  let state = item.state;
  let closesAt = item.closesAt;

  if (state === "OPEN" && paidSpent >= activationTargetPaidCredits(item.prizeValueZAR)) {
    closesAt = new Date(now.getTime() + item.countdownMinutes * 60_000);
    await prisma.item.update({
      where: { id: item.id },
      data: { state: "ACTIVATED", closesAt },
    });
    state = "ACTIVATED";
  }

  if (state === "ACTIVATED" && closesAt && now > closesAt) {
    await prisma.item.update({
      where: { id: item.id },
      data: { state: "CLOSED" },
    });
    state = "CLOSED";
  }

  if (state === "CLOSED") {
    if (winnerCount === 0) {
      await settleItemWinners(item.id);
    }

    await prisma.item.update({
      where: { id: item.id },
      data: { state: "PUBLISHED" },
    });
    state = "PUBLISHED";
  }

  return { ...item, state, closesAt };
}

export default async function HomePage() {
  noStore();

  const now = new Date();

  const items = await prisma.item.findMany({
    orderBy: [{ createdAt: "asc" }],
    take: 6,
  });

  const paidAgg = await prisma.attempt.groupBy({
    by: ["itemId"],
    _sum: { paidUsed: true },
  });
  const paidMap = new Map(paidAgg.map((row) => [row.itemId, Number(row._sum.paidUsed ?? 0)]));

  const winnerCounts = await prisma.winner.groupBy({
    by: ["itemId"],
    _count: { _all: true },
  });
  const winnersMap = new Map(winnerCounts.map((row) => [row.itemId, row._count._all]));

  const synced = await Promise.all(
    items.map((item) =>
      syncItemState(item, now, paidMap.get(item.id) ?? 0, winnersMap.get(item.id) ?? 0),
    ),
  );

  const anyActivated = synced.some((item) => item.state === "ACTIVATED");

  return (
    <main className="mx-auto max-w-[1780px] px-3 py-2 sm:px-4 lg:px-5">
      <WelcomeModal />

      <section className="mb-2 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="leading-none">
              <span className="text-[22px] font-semibold text-slate-700 sm:text-[26px]">Pick. Play.</span>{" "}
              <span className="text-[34px] font-black text-blue-600 sm:text-[40px]">PwnIt.</span>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Choose a prize, play a quick skill game, and try to win it.
            </p>
          </div>

          {anyActivated ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
              Live prizes are active now.
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
              New rounds activate as interest builds.
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
        {synced.map((item) => {
          const paidSpent = paidMap.get(item.id) ?? 0;
          const progress = activationProgress(item.prizeValueZAR, paidSpent);
          const pct = typeof progress === "number" ? progress : progress.pct;

          return (
            <ItemCard
              key={item.id}
              item={{
                id: item.id,
                title: item.title,
                prizeValueZAR: item.prizeValueZAR,
                state: item.state,
                imageUrl: item.imageUrl,
                closesAt: item.closesAt ? new Date(item.closesAt).toISOString() : null,
                playCostCredits: playCostForPrize(item.prizeValueZAR),
                gameKey: item.gameKey,
                activationPct: pct,
              }}
            />
          );
        })}
      </section>

      <AutoRefreshActivated enabled={anyActivated} />
    </main>
  );
}
