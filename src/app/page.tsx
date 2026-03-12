import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/auth";
import { AutoRefreshActivated } from "@/components/AutoRefreshActivated";
import { settleItemWinners } from "@/lib/settle";
import { ItemCard } from "@/components/ItemCard";
import {
  activationProgress,
  activationTargetPaidCredits,
  playCostForPrize,
} from "@/lib/playCost";
import { WelcomeModal } from "@/components/WelcomeModal";

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
    await prisma.item.update({ where: { id: item.id }, data: { state: "CLOSED" } });
    state = "CLOSED";
  }

  if (state === "CLOSED") {
    if (winnerCount === 0) {
      await settleItemWinners(item.id);
      await prisma.item.update({ where: { id: item.id }, data: { state: "PUBLISHED" } });
      state = "PUBLISHED";
    } else {
      await prisma.item.update({ where: { id: item.id }, data: { state: "PUBLISHED" } });
      state = "PUBLISHED";
    }
  }

  return {
    ...item,
    state,
    closesAt,
  };
}

export default async function HomePage() {
  noStore();

  const user = await getOrCreateDemoUser();
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
    <section className="flex min-h-0 w-full flex-1 flex-col gap-3 lg:gap-4">
      <WelcomeModal />
      <AutoRefreshActivated enabled={anyActivated} everyMs={10_000} />

      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-[11px]">
        Logged in as{" "}
        <span className="font-bold normal-case tracking-normal text-slate-900">{user.email}</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex-1 lg:min-h-0 lg:grid-cols-3 lg:grid-rows-2 lg:content-stretch xl:gap-4 2xl:gap-5">
        {synced.map((item) => {
          const paidSpent = paidMap.get(item.id) ?? 0;
          const progress = activationProgress(item.prizeValueZAR, paidSpent);

          return (
            <ItemCard
              key={item.id}
              item={{
                id: item.id,
                title: item.title,
                prizeValueZAR: item.prizeValueZAR,
                state: item.state,
                imageUrl: item.imageUrl,
                closesAt: item.closesAt?.toISOString() ?? null,
                playCostCredits: playCostForPrize(item.prizeValueZAR),
                gameKey: item.gameKey,
                activationPct: progress.pct,
                activationLabel: progress.pct >= 100 ? "Activated" : undefined,
              }}
            />
          );
        })}
      </div>
    </section>
  );
}
