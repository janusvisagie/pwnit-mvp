import Link from "next/link";
import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/auth";
import { CountdownChip } from "@/components/CountdownChip";
import { playCostForPrize } from "@/lib/playCost";
import { settleItemWinners } from "@/lib/settle";
import { BuyNowButton } from "@/components/BuyNowButton";

function formatZAR(v: number) {
  return `R${Number(v || 0).toLocaleString("en-ZA")}`;
}

function stateLabel(s: string) {
  if (s === "OPEN") return "Open";
  if (s === "ACTIVATED") return "Live";
  if (s === "CLOSED") return "Closed";
  if (s === "PUBLISHED") return "Results";
  return s || "Open";
}

export default async function ItemPage({ params }: { params: { id: string } }) {
  const me = await getOrCreateDemoUser();
  const itemId = params.id;
  const now = new Date();

  let item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    return (
      <main className="mx-auto max-w-3xl space-y-3 p-4">
        <h1 className="text-xl font-extrabold">Item not found</h1>
        <Link className="text-sm font-semibold text-slate-900 hover:underline" href="/">
          ← Back to Home
        </Link>
      </main>
    );
  }

  if (item.state === "ACTIVATED" && item.closesAt && now > item.closesAt) {
    await prisma.item.update({ where: { id: item.id }, data: { state: "CLOSED" } });
    item = { ...item, state: "CLOSED" } as any;
  }

  if (item.state === "CLOSED") {
    const already = await prisma.winner.count({ where: { itemId: item.id } });
    if (already === 0) {
      await settleItemWinners(item.id);
      item = { ...item, state: "PUBLISHED" } as any;
    }
  }

  const closesAtIso = item.closesAt ? item.closesAt.toISOString() : null;
  const playCost = playCostForPrize(item.prizeValueZAR);
  const totalEntries = await prisma.attempt.count({ where: { itemId: item.id } });

  const winners = await prisma.winner.findMany({
    where: { itemId },
    take: 200,
    select: { userId: true },
  });
  const meWon = winners.some((w) => w.userId === me.id);
  const isPlayable = item.state === "OPEN" || item.state === "ACTIVATED";
  const progressPct = Math.min(100, Math.round((totalEntries / Math.max(1, item.activationGoalEntries)) * 100));

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold leading-tight text-slate-900">{item.title}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700">
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">{stateLabel(item.state)}</span>
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">Prize: <span className="text-slate-900">{formatZAR(item.prizeValueZAR)}</span></span>
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">Cost: <span className="text-slate-900">{playCost}</span> {playCost === 1 ? "credit" : "credits"} / play</span>
            {item.state === "ACTIVATED" && closesAtIso ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                <span className="text-slate-600">Ends in</span>
                <CountdownChip state={item.state} closesAt={closesAtIso} />
              </span>
            ) : (
              <CountdownChip state={item.state} closesAt={closesAtIso} />
            )}
          </div>
        </div>
      </div>

      {item.state === "OPEN" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-extrabold text-slate-900">Activation progress</div>
              <div className="mt-1 text-xs text-slate-600">
                Plays: <span className="font-semibold text-slate-900">{totalEntries}/{item.activationGoalEntries}</span>
              </div>
            </div>
            <div className="rounded-full bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-900 ring-1 ring-slate-200">{progressPct}%</div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full bg-slate-900" style={{ width: `${progressPct}%` }} />
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid gap-4 p-4 sm:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title} className="mx-auto max-h-[280px] w-auto object-contain" />
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-slate-500">Image unavailable</div>
            )}
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500">How to play</div>
              <div className="mt-2 text-sm text-slate-700">Play the skill game and try to finish with the best score.</div>
              <div className="mt-3 text-sm text-slate-700">If you don&apos;t win, you can still buy it by paying the difference.</div>
            </div>

            <div className="flex flex-wrap gap-2">
              {isPlayable ? (
                <Link href={`/play/${item.id}`} className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-slate-800">
                  Play now
                </Link>
              ) : null}
              <Link href={`/item/${item.id}/leaderboard`} className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-extrabold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50">
                Leaderboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        {meWon ? (
          <div className="text-sm font-semibold text-slate-900">🎉 You&apos;re a winner — no need to buy.</div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm font-extrabold text-slate-900">Didn&apos;t win? Buy it by paying the difference.</div>
            <BuyNowButton itemId={itemId} />
          </div>
        )}
      </section>
    </main>
  );
}
