// src/lib/settle.ts
import { prisma } from "@/lib/db";
import { dayKeyZA } from "@/lib/time";

/**
 * Settle winners for an item for "today" (dayKeyZA).
 *
 * ✅ Winner rule: "Top X% win" (default 5%).
 * - winnersCount = ceil(uniquePlayersToday * pct)
 * - clamp to [minWinners, maxWinners]
 * - ranks determined by best (lowest) score per user for the day
 *
 * ✅ Idempotent: if winners already exist for (itemId, dayKey), it returns the existing cutoff info.
 *
 * ✅ Returns cutoff info so UI can display:
 *    "Winners: Top X% (N winners today)"
 */
export type SettleResult = {
  ok: boolean;
  dayKey: string;
  itemId: string;
  winnersPublished: boolean;

  // display helpers
  pct: number; // e.g. 0.05
  pctLabel: string; // e.g. "5%"
  uniquePlayers: number;
  winnersCount: number;
  cutoffRank: number; // equals winnersCount when winners published; 0 if none
};

const DEFAULT_TOP_PCT = 0.05; // 5%
const DEFAULT_MIN_WINNERS = 1;
// Optional safety cap. Adjust or remove if you want unlimited scaling.
const DEFAULT_MAX_WINNERS = 50;

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function pctToLabel(pct: number) {
  // 0.05 => "5%"
  const v = Math.round(pct * 1000) / 10; // one decimal if needed
  return Number.isInteger(v) ? `${v.toFixed(0)}%` : `${v}%`;
}

export async function settleItemWinners(
  itemId: string,
  opts?: {
    pct?: number; // e.g. 0.05
    minWinners?: number; // e.g. 1
    maxWinners?: number; // e.g. 50
    publishItem?: boolean; // default true
  }
): Promise<SettleResult> {
  const dayKey = dayKeyZA();

  const pct = typeof opts?.pct === "number" ? opts.pct : DEFAULT_TOP_PCT;
  const minWinners = typeof opts?.minWinners === "number" ? opts.minWinners : DEFAULT_MIN_WINNERS;
  const maxWinners = typeof opts?.maxWinners === "number" ? opts.maxWinners : DEFAULT_MAX_WINNERS;
  const publishItem = opts?.publishItem !== false;

  // If already published for today, just return what exists (idempotent).
  const existingWinners = await prisma.winner.findMany({
    where: { itemId, dayKey },
    orderBy: [{ rank: "asc" }],
    select: { rank: true },
  });

  if (existingWinners.length > 0) {
    const cutoffRank = existingWinners[existingWinners.length - 1]?.rank ?? existingWinners.length;
    // Estimate unique players today from attempts (cheap + good enough for display)
    // (If you prefer exact, you can compute from attempts like below.)
    const uniquePlayersAgg = await prisma.attempt.groupBy({
      by: ["userId"],
      where: { itemId, dayKey },
    });

    const uniquePlayers = uniquePlayersAgg.length;
    const winnersCount = existingWinners.length;

    return {
      ok: true,
      dayKey,
      itemId,
      winnersPublished: true,
      pct,
      pctLabel: pctToLabel(pct),
      uniquePlayers,
      winnersCount,
      cutoffRank,
    };
  }

  // Pull attempts ordered best-first and keep best attempt per user.
  const attempts = await prisma.attempt.findMany({
    where: { itemId, dayKey },
    orderBy: [{ scoreMs: "asc" }, { createdAt: "asc" }],
    select: { userId: true, scoreMs: true, createdAt: true },
  });

  const bestByUser = new Map<string, { userId: string; scoreMs: number; createdAt: Date }>();
  for (const a of attempts) {
    if (!bestByUser.has(a.userId)) bestByUser.set(a.userId, a);
  }

  const uniquePlayers = bestByUser.size;

  // No players = no winners to publish.
  if (uniquePlayers === 0) {
    return {
      ok: true,
      dayKey,
      itemId,
      winnersPublished: false,
      pct,
      pctLabel: pctToLabel(pct),
      uniquePlayers: 0,
      winnersCount: 0,
      cutoffRank: 0,
    };
  }

  // Top X% win:
  // winnersCount = ceil(uniquePlayers * pct), clamped.
  const rawCount = Math.ceil(uniquePlayers * pct);
  const winnersCount = clamp(rawCount, minWinners, maxWinners);

  // Sort winners (best score per user already implied by insertion order from attempts)
  const ranked = Array.from(bestByUser.values()).slice(0, winnersCount);

  // Fetch aliases for winners
  const users = await prisma.user.findMany({
    where: { id: { in: ranked.map((w) => w.userId) } },
    select: { id: true, alias: true, email: true },
  });

  const aliasById = new Map(
    users.map((u) => [
      u.id,
      (u.alias && u.alias.trim()) || (u.email?.split("@")[0] ?? "player"),
    ])
  );

  await prisma.winner.createMany({
    data: ranked.map((w, idx) => ({
      itemId,
      userId: w.userId,
      dayKey,
      rank: idx + 1,
      scoreMs: w.scoreMs,
      alias: aliasById.get(w.userId) ?? "player",
    })),
  });

  if (publishItem) {
    await prisma.item.update({
      where: { id: itemId },
      data: { state: "PUBLISHED", publishedAt: new Date() },
    });
  }

  return {
    ok: true,
    dayKey,
    itemId,
    winnersPublished: true,
    pct,
    pctLabel: pctToLabel(pct),
    uniquePlayers,
    winnersCount: ranked.length,
    cutoffRank: ranked.length, // cutoff rank == N winners
  };
}
