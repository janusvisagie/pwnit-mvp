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
    items.map((item) => syncItemState(item, now, paidMap.get(item.id) ?? 0, winnersMap.get(item.id) ?? 0)),
  );

  const anyActivated = synced.some((item) => item.state === "ACTIVATED");

  return (
    <main className="px-0 py-0">
      <WelcomeModal />
      <section className="grid grid-cols-1 gap-1 md:grid-cols-2 xl:h-[calc(100vh-4.75rem)] xl:grid-cols-3 xl:auto-rows-fr">
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
