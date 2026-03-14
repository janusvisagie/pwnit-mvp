import Link from "next/link";
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

async function syncItemState(
  item: HomeItem,
  now: Date,
  paidSpent: number,
  winnerCount: number,
) {
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

  return {
    ...item,
    state,
    closesAt,
  };
}

function statCard(label: string, value: number, tone: string) {
  return (
    <div className={`rounded-[22px] border border-white/20 ${tone} px-4 py-3 text-white shadow-lg shadow-slate-950/10`}>
      <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">{label}</div>
      <div className="mt-1 text-2xl font-black tracking-tight">{value}</div>
    </div>
  );
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
    items.map((item) =>
      syncItemState(item, now, paidMap.get(item.id) ?? 0, winnersMap.get(item.id) ?? 0),
    ),
  );

  const anyActivated = synced.some((item) => item.state === "ACTIVATED");
  const liveCount = synced.filter((item) => item.state === "ACTIVATED").length;
  const openCount = synced.filter((item) => item.state === "OPEN").length;
  const wonCount = synced.filter((item) => item.state === "PUBLISHED" || item.state === "CLOSED").length;

  return (
    <main className="flex w-full flex-col gap-4 lg:gap-5">
      <WelcomeModal />
      <AutoRefreshActivated enabled={anyActivated} everyMs={10_000} />

      <section className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-[linear-gradient(135deg,#020617_0%,#0f172a_42%,#1e3a8a_100%)] px-5 py-5 text-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] sm:px-6 sm:py-6 xl:px-7 xl:py-7">
        <div className="absolute -left-12 top-6 h-32 w-32 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-fuchsia-400/15 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/40 pwnit-shimmer" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.22em] text-white/80 backdrop-blur-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-300" />
              </span>
              Live marketplace
            </div>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl xl:text-[44px]">
              Pick. Play. <span className="text-cyan-300">PwnIt.</span>
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-[15px] sm:leading-7">
              Choose a prize, play a quick skill game, and climb the leaderboard. The interface below is now more visual and responsive, while the activation, countdown, winner and credit logic all stay exactly as they were.
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-medium text-white/90 backdrop-blur-sm">
                Logged in as <span className="ml-1 font-black text-white">{user.email}</span>
              </span>
              <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-medium text-white/90 backdrop-blur-sm">
                {synced.length} prizes currently in rotation
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link
                href="/how-activation-works"
                className="inline-flex min-h-[46px] items-center justify-center rounded-[18px] bg-white px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-100"
              >
                How it works
              </Link>
              <Link
                href="/buy-credits"
                className="inline-flex min-h-[46px] items-center justify-center rounded-[18px] border border-white/15 bg-white/10 px-5 py-3 text-sm font-extrabold text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/15"
              >
                Buy credits
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3 xl:min-w-[420px] xl:max-w-[520px] xl:flex-1">
            {statCard("Open", openCount, "bg-white/10 backdrop-blur-sm")}
            {statCard("Live", liveCount, "bg-cyan-400/15 backdrop-blur-sm")}
            {statCard("Won", wonCount, "bg-fuchsia-400/15 backdrop-blur-sm")}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:gap-5">
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
                imageUrl: item.imageUrl ?? null,
                closesAt: item.closesAt ? item.closesAt.toISOString() : null,
                playCostCredits: playCostForPrize(item.prizeValueZAR),
                gameKey: item.gameKey ?? null,
                activationPct: pct,
                activationLabel: pct >= 100 ? "Activated" : undefined,
              }}
            />
          );
        })}
      </section>
    </main>
  );
}
