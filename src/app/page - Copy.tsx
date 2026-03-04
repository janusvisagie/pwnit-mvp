// src/app/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/db";
import { dayKeyZA } from "@/lib/time";
import { getOrCreateDemoUser } from "@/lib/auth";
import { AutoRefreshActivated } from "@/components/AutoRefreshActivated";
import { settleItemWinners } from "@/lib/settle";
import { ItemCard } from "@/components/ItemCard";

export default async function HomePage() {
  const user = await getOrCreateDemoUser();
  const dayKey = dayKeyZA();
  const now = new Date();

  // 4 items for focus
  const items = await prisma.item.findMany({
    orderBy: [{ createdAt: "asc" }],
    take: 4,
  });

  const counts = await prisma.attempt.groupBy({
    by: ["itemId"],
    where: { dayKey },
    _count: { _all: true },
  });
  const entryMap = new Map(counts.map((c) => [c.itemId, c._count._all]));

  const winnerCounts = await prisma.winner.groupBy({
    by: ["itemId"],
    _count: { _all: true },
  });
  const winnersMap = new Map(winnerCounts.map((w) => [w.itemId, w._count._all]));

  // state transitions
  for (const item of items) {
    const totalToday = entryMap.get(item.id) ?? 0;

    if (item.state === "OPEN" && totalToday >= item.activationGoalEntries) {
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
    take: 4,
  });

  const anyActivated = refreshed.some((it) => it.state === "ACTIVATED");

  return (
    // Key: fill available height from layout, and prevent spill causing scroll
    <main className="flex h-full min-h-0 flex-col gap-2 overflow-hidden pb-1">
      <AutoRefreshActivated enabled={anyActivated} everyMs={10_000} />

      {/* Top bar (tight) */}
      <div className="shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-slate-600">
            Logged in as <span className="font-semibold text-slate-900">{user.email}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link className="text-sm font-semibold text-slate-900 hover:underline" href="/buy-credits">
              Buy credits
            </Link>
            <Link className="text-sm font-semibold text-slate-900 hover:underline" href="/how-activation-works">
              How it works
            </Link>
          </div>
        </div>
      </div>

      {/* Grid consumes remaining height — centered + narrower (reduces side whitespace) */}
      <div className="flex flex-1 min-h-0 justify-center overflow-hidden">
        <div className="grid w-full max-w-4xl flex-1 min-h-0 grid-cols-2 gap-3">
          {refreshed.map((it) => (
            <ItemCard
              key={it.id}
              item={{
                id: it.id,
                title: it.title,
                tier: it.tier,
                prizeType: it.prizeType,
                prizeValueZAR: it.prizeValueZAR,
                state: it.state as any,
                activationGoalEntries: it.activationGoalEntries,
                totalEntriesToday: entryMap.get(it.id) ?? 0,
                countdownMinutes: it.countdownMinutes,
                closesAt: it.closesAt ? it.closesAt.toISOString() : null,
                winnersCount: winnersMap.get(it.id) ?? 0,
                imageUrl: it.imageUrl ?? null,
                shortDesc: (it as any).shortDesc ?? null,
                productUrl: (it as any).productUrl ?? null,
              }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}