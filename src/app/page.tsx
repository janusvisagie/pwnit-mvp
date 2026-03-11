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
  const paidMap = new Map(
    paidAgg.map((entry) => [entry.itemId, Number(entry._sum.paidUsed ?? 0)]),
  );

  const winnerCounts = await prisma.winner.groupBy({
    by: ["itemId"],
    _count: { _all: true },
  });
  const winnersMap = new Map(
    winnerCounts.map((entry) => [entry.itemId, entry._count._all]),
  );

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
      await prisma.item.update({
        where: { id: item.id },
        data: { state: "CLOSED" },
      });
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

  const anyActivated = refreshed.some((item) => item.state === "ACTIVATED");

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-9.75rem)] w-full max-w-[1380px] flex-col px-4 pb-3 pt-2 sm:px-6 lg:px-8">
      <WelcomeModal />
      {anyActivated ? <AutoRefreshActivated /> : null}

      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 sm:mb-3">
        Logged in as <span className="font-black text-slate-800">{user.email}</span>
      </div>

      <section className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3 md:grid-rows-2 xl:gap-4">
        {refreshed.map((item) => {
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
                playCostCredits:
                  typeof item.playCostCredits === "number"
                    ? item.playCostCredits
                    : playCostForPrize(item.prizeValueZAR),
                gameKey: item.gameKey,
                activationPct: progress,
                activationLabel: progress >= 100 ? "Activated" : undefined,
              }}
            />
          );
        })}
      </section>
    </main>
  );
}
