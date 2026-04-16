import { unstable_noStore as noStore } from "next/cache";

import { AutoRefreshActivated } from "@/components/AutoRefreshActivated";
import { ItemCard } from "@/components/ItemCard";
import { WelcomeModal } from "@/components/WelcomeModal";
import { prisma } from "@/lib/db";
import { activationProgress, resolvePlayCostCredits } from "@/lib/playCost";
import { ensureCurrentRound, publicProgress, ROUND_STATES, syncHomeItems } from "@/lib/rounds";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CardModel = {
  id: string;
  title: string;
  prizeValueZAR: number;
  state: string;
  imageUrl: string | null;
  closesAt: string | null;
  playCostCredits: number;
  gameKey: string | null;
  activationPct: number;
  playerActivityPct: number;
  verifiedSubscriberPct: number;
  activationCurrent: number;
  activationTarget: number;
  playerActivityCredits: number;
  verifiedSubscriberCredits: number;
};

async function loadRoundBasedCards(): Promise<CardModel[]> {
  await syncHomeItems();

  const items = await prisma.item.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: 6,
  });

  return Promise.all(
    items.map(async (item) => {
      const round = await ensureCurrentRound(item.id);
      const progress = round
        ? publicProgress({
            paidCreditsCollected: Number((round as any).paidCreditsCollected ?? 0),
            freeCreditsCollected: Number((round as any).freeCreditsCollected ?? 0),
            verifiedSubscriberCreditsCollected: Number((round as any).verifiedSubscriberCreditsCollected ?? 0),
            activationTargetCredits: Number((round as any).activationTargetCredits ?? 0),
            state: String(round.state || ""),
          })
        : { pct: 0, playerPct: 0, verifiedSubscriberPct: 0, current: 0, target: 1, playerCredits: 0, verifiedSubscriberCredits: 0 };

      return {
        id: item.id,
        title: item.title,
        prizeValueZAR: item.prizeValueZAR,
        state: String(round?.state || item.state || "OPEN"),
        imageUrl: item.imageUrl,
        closesAt: round?.closesAt ? new Date(round.closesAt).toISOString() : null,
        playCostCredits: resolvePlayCostCredits(item),
        gameKey: item.gameKey,
        activationPct: Number(progress.pct ?? 0),
        playerActivityPct: Number(progress.playerPct ?? 0),
        verifiedSubscriberPct: Number(progress.verifiedSubscriberPct ?? 0),
        activationCurrent: Number(progress.current ?? 0),
        activationTarget: Number(progress.target ?? 1),
        playerActivityCredits: Number(progress.playerCredits ?? 0),
        verifiedSubscriberCredits: Number(progress.verifiedSubscriberCredits ?? 0),
      } satisfies CardModel;
    }),
  );
}

async function loadLegacyCompatibleCards(): Promise<CardModel[]> {
  const items = await prisma.item.findMany({
    select: {
      id: true,
      title: true,
      prizeValueZAR: true,
      state: true,
      imageUrl: true,
      closesAt: true,
      createdAt: true,
      gameKey: true,
    },
    orderBy: [{ createdAt: "asc" }],
    take: 6,
  });

  const usage = await prisma.attempt.groupBy({
    by: ["itemId"],
    _sum: {
      paidUsed: true,
      freeUsed: true,
    },
  });

  const usageMap = new Map(
    usage.map((row) => [
      row.itemId,
      {
        paid: Number(row._sum.paidUsed ?? 0),
        free: Number(row._sum.freeUsed ?? 0),
      },
    ]),
  );

  return items.map((item) => {
    const playCostCredits = resolvePlayCostCredits({ prizeValueZAR: item.prizeValueZAR });
    const target = playCostCredits * 100;
    const usageRow = usageMap.get(item.id) ?? { paid: 0, free: 0 };
    const current = usageRow.paid + usageRow.free;
    const progress = activationProgress(current, target);

    return {
      id: item.id,
      title: item.title,
      prizeValueZAR: item.prizeValueZAR,
      state: String(item.state || "OPEN"),
      imageUrl: item.imageUrl,
      closesAt: item.closesAt ? new Date(item.closesAt).toISOString() : null,
      playCostCredits,
      gameKey: item.gameKey,
      activationPct: Number(progress.pct ?? 0),
      playerActivityPct: Number(progress.pct ?? 0),
      verifiedSubscriberPct: 0,
      activationCurrent: current,
      activationTarget: target,
      playerActivityCredits: current,
      verifiedSubscriberCredits: 0,
    } satisfies CardModel;
  });
}

export default async function HomePage() {
  noStore();

  let cards: CardModel[] = [];

  try {
    cards = await loadRoundBasedCards();
  } catch (error) {
    console.error("HomePage round-based load failed; falling back to legacy-compatible cards.", error);
    cards = await loadLegacyCompatibleCards();
  }

  const anyActivated = cards.some((item) => item.state === ROUND_STATES.ACTIVATED || item.state === "ACTIVATED");

  return (
    <>
      <AutoRefreshActivated enabled={anyActivated} />
      <WelcomeModal />
      <main className="mx-auto max-w-7xl px-4 pb-6 pt-4 sm:px-5 lg:px-6">
        <div className="mb-5 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Pick. Play. PwnIt.</div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Prizes build through play and verified subscriber growth.</h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600 sm:text-base">
            Each item activates from registered player activity plus visible verified subscriber contribution. Free daily credits stay at 30, unlimited practice remains open, and premium items can still use that full daily free balance for one registered attempt.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </main>
    </>
  );
}
