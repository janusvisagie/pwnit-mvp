import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/auth";
import { AutoRefreshActivated } from "@/components/AutoRefreshActivated";
import { settleItemWinners } from "@/lib/settle";
import { ItemCard } from "@/components/ItemCard";
import { playCostForPrize } from "@/lib/playCost";
import { WelcomeModal } from "@/components/WelcomeModal";

export default async function HomePage() {
  const user = await getOrCreateDemoUser();
  const now = new Date();

  const items = await prisma.item.findMany({
    orderBy: [{ createdAt: "asc" }],
    take: 6,
  });

  const counts = await prisma.attempt.groupBy({
    by: ["itemId"],
    _count: { _all: true },
  });
  const entryMap = new Map(counts.map((c) => [c.itemId, c._count._all]));

  const winnerCounts = await prisma.winner.groupBy({
    by: ["itemId"],
    _count: { _all: true },
  });
  const winnersMap = new Map(winnerCounts.map((w) => [w.itemId, w._count._all]));

  for (const item of items) {
    const totalAttempts = entryMap.get(item.id) ?? 0;

    if (item.state === "OPEN" && totalAttempts >= item.activationGoalEntries) {
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
    <main className="flex min-h-0 flex-col gap-4 pb-2">
      <WelcomeModal />
      <AutoRefreshActivated enabled={anyActivated} everyMs={10_000} />

      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="text-sm font-semibold text-slate-600">Logged in as <span className="text-slate-900">{user.email}</span></div>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">Choose a prize. Play a skill game. Win.</h1>
        <p className="mt-1 text-sm text-slate-600">Or buy it if you don’t.</p>
      </section>

      {refreshed.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="text-base font-extrabold text-slate-900">No items yet</div>
          <div className="mt-1 text-sm text-slate-600">Seed the MVP items to populate the marketplace.</div>
          <div className="mt-3 text-sm">
            <span className="mr-2 font-semibold text-slate-900">Run:</span>
            <code className="rounded bg-slate-100 px-2 py-1 text-xs">npm run db:seed</code>
          </div>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {refreshed.map((it) => (
            <ItemCard
              key={it.id}
              item={{
                id: it.id,
                title: it.title,
                prizeValueZAR: it.prizeValueZAR,
                state: it.state,
                activationGoalEntries: it.activationGoalEntries,
                totalEntriesToday: entryMap.get(it.id) ?? 0,
                imageUrl: it.imageUrl ?? null,
                closesAt: it.closesAt ? it.closesAt.toISOString() : null,
                playCostCredits: playCostForPrize(it.prizeValueZAR),
                gameKey: it.gameKey ?? null,
              }}
            />
          ))}
        </section>
      )}
    </main>
  );
}
