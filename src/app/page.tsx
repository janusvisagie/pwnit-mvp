// src/app/page.tsx
import { prisma } from "@/lib/db";
import { dayKeyZA } from "@/lib/time";
import { getOrCreateDemoUser } from "@/lib/auth";
import { AutoRefreshActivated } from "@/components/AutoRefreshActivated";
import { settleItemWinners } from "@/lib/settle";
import { ItemCard } from "@/components/ItemCard";
import { playCostForPrize } from "@/lib/playCost";
import { itemPriceCredits } from "@/lib/pricing";
import { WelcomeModal } from "@/components/WelcomeModal";

export default async function HomePage() {
  const user = await getOrCreateDemoUser();
  const dayKey = dayKeyZA();
  const now = new Date();

  const items = await prisma.item.findMany({
    orderBy: [{ createdAt: "asc" }],
    take: 6,
  });

  const counts = await prisma.attempt.groupBy({
    by: ["itemId"],
    where: { dayKey },
    _count: { _all: true },
  });
  const entryMap = new Map(counts.map((c) => [c.itemId, c._count._all]));

  const paidCounts = await prisma.attempt.groupBy({
    by: ["itemId"],
    where: { dayKey },
    _sum: { paidUsed: true },
  });
  const paidMap = new Map(paidCounts.map((c) => [c.itemId, Number((c as any)._sum?.paidUsed ?? 0)]));

  const winnerCounts = await prisma.winner.groupBy({
    by: ["itemId"],
    _count: { _all: true },
  });
  const winnersMap = new Map(winnerCounts.map((w) => [w.itemId, w._count._all]));

  for (const item of items) {
    const paidToday = paidMap.get(item.id) ?? 0;
    const coverageRatio = Number((item as any).activationCoverageRatio ?? 1);
    const activationGoalCredits = Math.max(1, Math.ceil(itemPriceCredits(item.prizeValueZAR) * coverageRatio));

    if (item.state === "OPEN" && paidToday >= activationGoalCredits) {
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

  const heroStats = {
    live: refreshed.filter((it) => it.state === "ACTIVATED").length,
    almost: refreshed.filter((it) => {
      const paidToday = paidMap.get(it.id) ?? 0;
      const coverageRatio = Number((it as any).activationCoverageRatio ?? 1);
      const goal = Math.max(1, Math.ceil(itemPriceCredits(it.prizeValueZAR) * coverageRatio));
      return it.state === "OPEN" && paidToday / goal >= 0.75;
    }).length,
  };

  return (
    <main className="pb-4">
      <WelcomeModal />
      <AutoRefreshActivated enabled={anyActivated} everyMs={10_000} />

      <section className="mb-4 rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Pick. Play. <span className="text-4xl sm:text-5xl">PwnIt</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
              Choose a prize. Play a skill game. Win.
            </p>
            <p className="mt-1 text-sm text-slate-500 sm:text-base">Or buy it if you don&apos;t.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:min-w-[220px]">
            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Live now</div>
              <div className="mt-1 text-xl font-black text-slate-950">{heroStats.live}</div>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Going live soon</div>
              <div className="mt-1 text-xl font-black text-slate-950">{heroStats.almost}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-600">
          Logged in as <span className="font-semibold text-slate-900">{user.email}</span>
        </div>
      </section>

      {refreshed.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="text-base font-extrabold text-slate-900">No items yet</div>
          <div className="mt-1 text-sm text-slate-600">Seed the MVP items to populate the home page.</div>
          <div className="mt-3 text-sm">
            <span className="mr-2 font-semibold text-slate-900">Run:</span>
            <code className="rounded bg-slate-100 px-2 py-1 text-xs">npm run db:seed</code>
          </div>
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {refreshed.map((it) => {
          const coverageRatio = Number((it as any).activationCoverageRatio ?? 1);
          const activationGoalCredits = Math.max(1, Math.ceil(itemPriceCredits(it.prizeValueZAR) * coverageRatio));

          return (
            <ItemCard
              key={it.id}
              item={{
                id: it.id,
                title: it.title,
                prizeValueZAR: it.prizeValueZAR,
                state: it.state as any,
                activationGoalEntries: it.activationGoalEntries,
                totalEntriesToday: entryMap.get(it.id) ?? 0,
                paidCreditsToday: paidMap.get(it.id) ?? 0,
                activationGoalCredits,
                imageUrl: it.imageUrl ?? null,
                closesAt: it.closesAt ? it.closesAt.toISOString() : null,
                countdownMinutes: (it as any).countdownMinutes ?? 5,
                playCostCredits: playCostForPrize(it.prizeValueZAR),
                gameKey: it.gameKey ?? null,
              }}
            />
          );
        })}
      </section>
    </main>
  );
}
