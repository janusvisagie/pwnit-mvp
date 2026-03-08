import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/auth";
import { AutoRefreshActivated } from "@/components/AutoRefreshActivated";
import { ItemCard } from "@/components/ItemCard";
import { WelcomeModal } from "@/components/WelcomeModal";
import { publicProgress, syncHomeItems } from "@/lib/rounds";

export default async function HomePage() {
  const user = await getOrCreateDemoUser();

  const baseItems = await prisma.item.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: 6,
    select: { id: true },
  });

  await syncHomeItems(baseItems.map((i) => i.id));

  const items = await prisma.item.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: 6,
    include: {
      rounds: {
        orderBy: [{ sequence: "desc" }],
        take: 1,
      },
    },
  });

  const anyActivated = items.some((it) => it.rounds[0]?.state === "ACTIVATED");

  return (
    <main className="flex h-full min-h-0 flex-col gap-3 overflow-hidden pb-1">
      <WelcomeModal />
      <AutoRefreshActivated enabled={anyActivated} everyMs={10_000} />

      <div className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        Logged in as <span className="font-bold text-slate-900 normal-case tracking-normal">{user.email}</span>
      </div>

      <div className="grid flex-1 min-h-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((it) => {
          const round = it.rounds[0];
          const progress = round ? publicProgress(round) : { pct: 0, label: "Starting", hot: false };
          return (
            <ItemCard
              key={it.id}
              item={{
                id: it.id,
                title: it.title,
                prizeValueZAR: it.prizeValueZAR,
                state: round?.state ?? it.state,
                imageUrl: it.imageUrl ?? null,
                closesAt: (round?.closesAt ?? it.closesAt)?.toISOString?.() ?? null,
                playCostCredits: it.playCostCredits,
                gameKey: it.gameKey ?? null,
                activationPct: progress.pct,
                activationLabel: progress.label,
                isHot: progress.hot,
              }}
            />
          );
        })}
      </div>
    </main>
  );
}
