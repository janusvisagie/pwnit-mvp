// src/app/item/[id]/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/db";
import { dayKeyZA } from "@/lib/time";
import { getOrCreateDemoUser } from "@/lib/auth";
import { CountdownChip } from "@/components/CountdownChip";
import { playCostForPrize } from "@/lib/playCost";
import { settleItemWinners } from "@/lib/settle";
import { BuyNowButton } from "@/components/BuyNowButton";

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

  // Prevent “Ending…” stuck: do transitions here too
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

  // activation progress today
  const todayEntries = await prisma.attempt.count({ where: { itemId: item.id, dayKey } });

  // winners today (if closed/published)
  const winners = await prisma.winner.findMany({
    where: { itemId, dayKey },
    take: 200,
    select: { userId: true },
  });
  const meWon = winners.some((w) => w.userId === me.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-extrabold text-slate-900">{item.title}</h1>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-700">
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
          {stateLabel(item.state)}
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
          Prize: {formatZAR(item.prizeValueZAR)}
        </span>
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

      {/* Activation progress (single panel) */}
      {item.state === "OPEN" ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-extrabold text-slate-900">Activation progress</div>
          <div className="mt-2 text-sm text-slate-700">
            Entries today:{" "}
            <span className="font-semibold text-slate-900">
              {todayEntries}/{item.activationGoalEntries}
            </span>{" "}
            <span className="text-slate-500">
              ({Math.max(0, item.activationGoalEntries - todayEntries)} to go)
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            When the goal is reached, the item goes live and the countdown starts automatically.
          </div>
        </div>
      ) : null}

      {/* Hero card */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="aspect-[16/9] bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl || "/placeholder.png"}
            alt={item.title}
            className="h-full w-full object-contain p-6"
          />
        </div>

        <div className="border-t border-slate-200 p-4">
          <div className="text-sm text-slate-700">
            Play costs {playCost} {playCost === 1 ? "credit" : "credits"}. Lower time wins.
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
              href={`/item/${item.id}/leaderboard`}
            >
              Leaderboard
            </Link>
            <Link
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-extrabold text-white"
              href={`/play/${item.id}`}
            >
              Play now
            </Link>
          </div>

          {item.shortDesc ? (
            <div className="mt-4 text-sm text-slate-700">{item.shortDesc}</div>
          ) : null}
        </div>
      </div>

      {/* Buy-if-you-didn't-win */}
      {(item.state === "CLOSED" || item.state === "PUBLISHED") ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          {meWon ? (
            <>
              <div className="text-sm font-extrabold text-slate-900">
                You won — no need to buy.
              </div>
              <div className="mt-3">
                <Link
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
                  href={`/item/${item.id}/leaderboard`}
                >
                  View results
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-extrabold text-slate-900">
                Didn’t win? Buy it by paying the difference.
              </div>
              <div className="mt-3">
                <BuyNowButton itemId={item.id} />
              </div>
            </>
          )}
        </div>
      ) : null}

      {/* Buy now (available anytime) */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
        {meWon && (item.state === "CLOSED" || item.state === "PUBLISHED") ? (
          <>
            <div className="text-sm font-extrabold text-slate-900">You won — no need to buy.</div>
            <div className="mt-3">
              <Link
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
                href={`/item/${item.id}/leaderboard`}
              >
                View results
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="text-sm font-extrabold text-slate-900">Buy now (optional)</div>
            <div className="mt-1 text-sm text-slate-700">
              You can buy the item anytime. Your <span className="font-semibold">discount</span> is{' '}
              <span className="font-semibold">50%</span> of the paid credits you’ve used playing this item today.
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
