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

export default async function HomePage() {
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
  const paidMap = new Map(paidAgg.map((c) => [c.itemId, Number(c._sum.paidUsed ?? 0)]));

  const winnerCounts = await prisma.winner.groupBy({
    by: ["itemId"],
    _count: { _all: true },
  });
  const winnersMap = new Map(winnerCounts.map((w) => [w.itemId, w._count._all]));

  for (const item of items) {
    const paidSpent = paidMap.get(item.id) ?? 0;
    const targetPaidCredits = activationTargetPaidCredits(item.prizeValueZAR);

    if (item.state === "OPEN" && paidSpent >= targetPaidCredits) {
      const closes = new Date(now.getTime() + item.countdownMinutes * 60_000);
      await prisma.item.update({
        where: { id: item.id },
        data: { state: "ACTIVATED", closesAt: closes },
      });
      item.state = "ACTIVATED";
      item.closesAt = closes;
    }

    if (item.state === "ACTIVATED" && item.closesAt && now > item.closesAt) {
      await prisma.item.update({ where: { id: item.id }, data: { state: "CLOSED" } });
      item.state = "CLOSED";
    }

    if (item.state === "CLOSED") {
      const already = winnersMap.get(item.id) ?? 0;
      if (already === 0) {
        await settleItemWinners(item.id);
        item.state = "PUBLISHED";
      }
    }
  }

  const refreshed = await prisma.item.findMany({
    orderBy: [{ createdAt: "asc" }],
    take: 6,
  });

  const anyActivated = refreshed.some((it) => it.state === "ACTIVATED");

  return (
    <section className="flex w-full flex-1 flex-col gap-3 xl:gap-4">
      <WelcomeModal />
      <AutoRefreshActivated enabled={anyActivated} everyMs={10_000} />

      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-[11px]">
        Logged in as{" "}
        <span className="font-bold normal-case tracking-normal text-slate-900">{user.email}</span>
      </div>

      <div className="grid flex-1 auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4 xl:min-h-[calc(100svh-230px)] xl:grid-cols-3 2xl:gap-5">
        {refreshed.map((it) => {
          const paidSpent = paidMap.get(it.id) ?? 0;
          const progress = activationProgress(it.prizeValueZAR, paidSpent);

          return (
            <ItemCard
              key={it.id}
              item={{
                id: it.id,
                title: it.title,
                prizeValueZAR: it.prizeValueZAR,
                state: it.state,
                imageUrl: it.imageUrl,
                closesAt: it.closesAt?.toISOString() ?? null,
                playCostCredits: playCostForPrize(it.prizeValueZAR),
                gameKey: it.gameKey,
                activationPct: progress,
                activationLabel: progress >= 100 ? "Activated" : undefined,
              }}
            />
          );
        })}
      </div>
    </section>
  );
}
