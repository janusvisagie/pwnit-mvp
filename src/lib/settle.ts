// src/lib/settle.ts
import { prisma } from "@/lib/db";
import { dayKeyZA } from "@/lib/time";

/**
 * Settle winners for an item for "today" (dayKeyZA).
 *
 * Winner rule: Top X% win (default 5%).
 * - winnersCount = ceil(uniquePlayersToday * pct)
 * - clamp to [minWinners, maxWinners]
 * - ranks determined by best (lowest) score per user for the day
 *
 * Idempotent: if winners already exist for (itemId, dayKey), returns existing cutoff info.
 *
 * IMPORTANT: This project schema does NOT have item.publishedAt, so we never write it.
 */
export type SettleResult = {
  ok: boolean;
  dayKey: string;
  itemId: string;
  winnersPublished: boolean;
  pct: number;
  pctLabel: string;
  uniquePlayers: number;
  winnersCount: number;
  cutoffRank: number;
};

const DEFAULT_TOP_PCT = 0.05;
const DEFAULT_MIN_WINNERS = 1;
const DEFAULT_MAX_WINNERS = 50;

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function pctToLabel(pct: number) {
  const v = Math.round(pct * 1000) / 10;
  return Number.isInteger(v) ? `${v.toFixed(0)}%` : `${v}%`;
}

// ✅ IMPORTANT: exclude invalid attempts (e.g. memory incorrect) from leaderboard scoring
function validAttemptWhere() {
  return {
    OR: [{ flags: null }, { NOT: { flags: { contains: '"valid":false' } } }],
  } as const;
}

export async function settleItemWinners(
  itemId: string,
  opts?: {
    pct?: number;
    minWinners?: number;
    maxWinners?: number;
    publishItem?: boolean; // default true
  }
): Promise<SettleResult> {
  const dayKey = dayKeyZA();

  const pct = typeof opts?.pct === "number" ? opts.pct : DEFAULT_TOP_PCT;
  const minWinners = typeof opts?.minWinners === "number" ? opts.minWinners : DEFAULT_MIN_WINNERS;
  const maxWinners = typeof opts?.maxWinners === "number" ? opts.maxWinners : DEFAULT_MAX_WINNERS;
  const publishItem = opts?.publishItem !== false;

  // Idempotent: already settled today
  const existing = await prisma.winner.findMany({
    where: { itemId, dayKey },
    orderBy: [{ rank: "asc" }],
    select: { rank: true },
  });

  if (existing.length > 0) {
    const uniquePlayersAgg = await prisma.attempt.groupBy({
      by: ["userId"],
      where: { itemId, dayKey, ...validAttemptWhere() },
    });

    return {
      ok: true,
      dayKey,
      itemId,
      winnersPublished: true,
      pct,
      pctLabel: pctToLabel(pct),
      uniquePlayers: uniquePlayersAgg.length,
      winnersCount: existing.length,
      cutoffRank: existing[existing.length - 1]?.rank ?? existing.length,
    };
  }

  // Best attempt per user (valid attempts only)
  const attempts = await prisma.attempt.findMany({
    where: { itemId, dayKey, ...validAttemptWhere() },
    orderBy: [{ scoreMs: "asc" }, { createdAt: "asc" }],
    select: { userId: true, scoreMs: true, createdAt: true },
  });

  const bestByUser = new Map<string, { userId: string; scoreMs: number; createdAt: Date }>();
  for (const a of attempts) {
    if (!bestByUser.has(a.userId)) bestByUser.set(a.userId, a);
  }

  const uniquePlayers = bestByUser.size;
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

  const rawCount = Math.ceil(uniquePlayers * pct);
  const winnersCount = clamp(rawCount, minWinners, maxWinners);

  const ranked = Array.from(bestByUser.values()).slice(0, winnersCount);

  const users = await prisma.user.findMany({
    where: { id: { in: ranked.map((w) => w.userId) } },
    select: { id: true, alias: true, email: true },
  });

  const aliasById = new Map(
    users.map((u) => [u.id, (u.alias && u.alias.trim()) || (u.email?.split("@")[0] ?? "player")])
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
      data: { state: "PUBLISHED" },
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
    cutoffRank: ranked.length,
  };
}
