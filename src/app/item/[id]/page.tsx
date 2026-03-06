import Link from "next/link";
import { prisma } from "@/lib/db";
import { dayKeyZA } from "@/lib/time";
import { getOrCreateDemoUser } from "@/lib/auth";
import { CountdownChip } from "@/components/CountdownChip";
import { playCostForPrize } from "@/lib/playCost";
import { settleItemWinners } from "@/lib/settle";
import { BuyNowButton } from "@/components/BuyNowButton";
import { itemPriceCredits } from "@/lib/pricing";

export const dynamic = "force-dynamic";

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
  const dayKey = dayKeyZA();
  const now = new Date();

  let item = await prisma.item.findUnique({ where: { id: itemId } });

  if (!item) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-extrabold">Item not found</h1>
        <div className="mt-3">
          <Link className="text-sm font-semibold text-slate-900 underline" href="/">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (item.state === "ACTIVATED" && item.closesAt && now > item.closesAt) {
    await prisma.item.update({ where: { id: item.id }, data: { state: "CLOSED" } });
    item = { ...item, state: "CLOSED" } as any;
  }

  if (item.state === "CLOSED") {
    const already = await prisma.winner.count({ where: { itemId: item.id, dayKey } });
    if (already === 0) {
      await settleItemWinners(item.id);
      item = { ...item, state: "PUBLISHED" } as any;
    }
  }

  const closesAtIso = item.closesAt ? item.closesAt.toISOString() : null;
  const playCost = playCostForPrize(item.prizeValueZAR);
  const todayEntries = await prisma.attempt.count({ where: { itemId: item.id, dayKey } });
  const totalPaidAgg = await prisma.attempt.aggregate({ where: { itemId: item.id, dayKey }, _sum: { paidUsed: true } });
  const totalPaidToday = Number((totalPaidAgg as any)._sum?.paidUsed ?? 0);
  const coverageRatio = Number((item as any).activationCoverageRatio ?? 1);
  const activationGoalCredits = Math.max(1, Math.ceil(itemPriceCredits(item.prizeValueZAR) * coverageRatio));

  const winners = await prisma.winner.findMany({
    where: { itemId, dayKey },
    take: 200,
    select: { userId: true },
  });
  const meWon = winners.some((w) => w.userId === me.id);

  const paidAgg = await prisma.attempt.aggregate({
    where: { itemId: item.id, dayKey, userId: me.id },
    _sum: { paidUsed: true },
  });
  const paidSpentToday = Number((paidAgg as any)._sum?.paidUsed ?? 0);
  const discountZAR = Math.min(item.prizeValueZAR, Math.max(0, paidSpentToday));
  const dueZAR = Math.max(0, item.prizeValueZAR - discountZAR);
  const activationPct = Math.max(0, Math.min(100, Math.round((totalPaidToday / activationGoalCredits) * 100)));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-extrabold text-slate-900">{item.title}</h1>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-700">
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1">{stateLabel(item.state)}</span>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1">Prize: {formatZAR(item.prizeValueZAR)}</span>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
          Cost: {playCost} {playCost === 1 ? "credit" : "credits"} / play
        </span>
        {item.state === "ACTIVATED" && closesAtIso ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
            <span className="text-xs font-semibold text-slate-600">Ends in</span>
            <CountdownChip state={item.state} closesAtIso={closesAtIso} labelWhenClosed="Closed" />
          </span>
        ) : null}
      </div>

      {item.state === "OPEN" ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-extrabold text-slate-900">Activation progress</div>
          <div className="mt-2 text-sm text-slate-700">
            Paid today: <span className="font-semibold text-slate-900">{formatZAR(totalPaidToday)}</span> / {formatZAR(activationGoalCredits)}
            <span className="ml-2 text-slate-500">({activationPct}%)</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-slate-900 transition-[width] duration-500" style={{ width: `${activationPct}%` }} />
          </div>
          <div className="mt-2 text-sm text-slate-700">
            Coverage ratio: <span className="font-semibold text-slate-900">{Math.round(coverageRatio * 100)}%</span>
          </div>
          <div className="mt-1 text-xs text-slate-600">
            Entries today: {todayEntries}. When the paid-spend target is reached, the item goes live and the countdown starts automatically.
          </div>
        </div>
      ) : null}

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="aspect-[16/9] bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.imageUrl || "/placeholder.png"} alt={item.title} className="h-full w-full object-contain p-6" />
        </div>

        <div className="border-t border-slate-200 p-4">
          <div className="text-sm text-slate-700">Play costs {playCost} {playCost === 1 ? "credit" : "credits"}. Lower time wins.</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900" href={`/item/${item.id}/leaderboard`}>
              Leaderboard
            </Link>
            <Link className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-extrabold text-white" href={`/play/${item.id}`}>
              Play now
            </Link>
          </div>
          {item.shortDesc ? <div className="mt-4 text-sm text-slate-700">{item.shortDesc}</div> : null}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        {item.state === "PUBLISHED" && meWon ? (
          <>
            <div className="text-sm font-extrabold text-slate-900">You won — no need to buy.</div>
            <div className="mt-3">
              <Link className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900" href={`/item/${item.id}/leaderboard`}>
                View results
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="text-sm font-extrabold text-slate-900">Didn’t win? Buy it by paying the difference.</div>
            <div className="mt-1 text-sm text-slate-600">
              Your <span className="font-semibold text-slate-900">discount today</span> is <span className="font-semibold text-slate-900">{formatZAR(discountZAR)}</span>.
              You pay the difference: <span className="font-semibold text-slate-900">{formatZAR(dueZAR)}</span>.
            </div>
            <div className="mt-3">
              <BuyNowButton itemId={item.id} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
