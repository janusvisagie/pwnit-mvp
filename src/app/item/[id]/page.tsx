// src/app/item/[id]/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/db";
import { dayKeyZA } from "@/lib/time";
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
  const dayKey = dayKeyZA();
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

  const isPlayable = item.state === "OPEN" || item.state === "ACTIVATED";

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      {/* Header: keep only Home in header (no duplicates) */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold leading-tight text-slate-900">{item.title}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700">
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">{stateLabel(item.state)}</span>

            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
              Prize: <span className="text-slate-900">{formatZAR(item.prizeValueZAR)}</span>
            </span>

            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
              Cost: <span className="text-slate-900">{playCost}</span> {playCost === 1 ? "credit" : "credits"} / play
            </span>

            {/* ✅ Include “Ends in” wording on item page */}
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

      {/* Activation progress (single panel) */}
      {item.state === "OPEN" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-extrabold text-slate-900">Activation progress</div>
              <div className="mt-1 text-xs text-slate-600">
                Entries today:{" "}
                <span className="font-semibold text-slate-900">
                  {todayEntries}/{item.activationGoalEntries}
                </span>{" "}
                ({Math.max(0, item.activationGoalEntries - todayEntries)} to go)
              </div>
            </div>

            <div className="rounded-full bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-900 ring-1 ring-slate-200">
              {Math.min(100, Math.round((todayEntries / Math.max(1, item.activationGoalEntries)) * 100))}%
            </div>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-slate-900"
              style={{
                width: `${Math.min(100, Math.round((todayEntries / Math.max(1, item.activationGoalEntries)) * 100))}%`,
              }}
            />
          </div>

          <div className="mt-2 text-[11px] text-slate-500">
            When the goal is reached, the item goes live and the countdown starts automatically.
          </div>
        </section>
      ) : null}

      {/* Hero card */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative bg-slate-50 p-4">
          <div className="flex items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200/70">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl ?? ""}
              alt={item.title}
              className="h-[220px] w-full object-contain p-4 sm:h-[260px]"
            />
          </div>

          {/* single footer strip CTA (closest to product) */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
            <div className="text-xs text-slate-600">
              Play costs <span className="font-extrabold text-slate-900">{playCost}</span>{" "}
              {playCost === 1 ? "credit" : "credits"}. <span className="text-slate-500">Lower time wins.</span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                href={`/item/${itemId}/leaderboard`}
              >
                Leaderboard
              </Link>

              <Link
                className={[
                  "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-extrabold",
                  isPlayable ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-slate-200 text-slate-500 cursor-not-allowed",
                ].join(" ")}
                href={isPlayable ? `/play/${itemId}` : "#"}
                aria-disabled={!isPlayable}
              >
                Play now
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 p-4">
          <div className="text-sm font-semibold text-slate-900">{item.shortDesc ?? " "}</div>
        </div>
      </section>

      {/* Buy-if-you-didn't-win */}
      {(item.state === "CLOSED" || item.state === "PUBLISHED") && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          {meWon ? (
            <div className="text-sm font-semibold text-slate-900">🎉 You won — no need to buy.</div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-extrabold text-slate-900">Didn’t win? Buy it by paying the difference.</div>
              <div className="text-xs text-slate-600">The system applies your “credits spent playing” as a discount.</div>

              <BuyNowButton itemId={itemId} />
            </div>
          )}
        </section>
      )}
    </main>
  );
}
