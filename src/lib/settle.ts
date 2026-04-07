
import { Prisma } from "@prisma/client";

import { parseAttemptFlags } from "@/lib/botRisk";
import { prisma } from "@/lib/db";
import { compareScores } from "@/lib/gameRules";
import { dayKeyZA } from "@/lib/time";

export type RoundSettleResult = {
  ok: boolean;
  roundId: string;
  itemId: string;
  winnersPublished: boolean;
  uniquePlayers: number;
  winnersCount: number;
};

export type LegacySettleResult = {
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

const COMPLETED_ROUND_BONUSES = [0, 20, 10];
const DEFAULT_TOP_PCT = 0.05;

function validAttemptWhere(): Prisma.AttemptWhereInput {
  return {
    OR: [{ flags: null }, { NOT: { flags: { contains: '"valid":false' } } }],
  };
}

function finalistNeedsReview(attempt: { flags: string | null; scoreMs: number }) {
  const parsed = parseAttemptFlags(attempt.flags);
  return Boolean(parsed?.risk?.reviewRequired);
}

export async function settleRound(roundId: string): Promise<RoundSettleResult> {
  const round = await prisma.itemRound.findUnique({
    where: { id: roundId },
    include: { item: true },
  });
  if (!round) {
    return { ok: false, roundId, itemId: "", winnersPublished: false, uniquePlayers: 0, winnersCount: 0 };
  }

  const existing = await prisma.winner.findMany({ where: { roundId }, orderBy: [{ rank: "asc" }] });
  if (existing.length > 0) {
    return {
      ok: true,
      roundId,
      itemId: round.itemId,
      winnersPublished: true,
      uniquePlayers: existing.length,
      winnersCount: existing.length,
    };
  }

  if (round.state === "REVIEW") {
    const attemptsInReview = await prisma.attempt.count({ where: { roundId, ...validAttemptWhere() } });
    return {
      ok: true,
      roundId,
      itemId: round.itemId,
      winnersPublished: false,
      uniquePlayers: attemptsInReview,
      winnersCount: 0,
    };
  }

  const attempts = await prisma.attempt.findMany({
    where: { roundId, ...validAttemptWhere() },
    select: { id: true, userId: true, scoreMs: true, createdAt: true, flags: true },
    orderBy: [{ createdAt: "asc" }],
  });

  const bestByUser = new Map<string, (typeof attempts)[number]>();
  for (const attempt of attempts) {
    const current = bestByUser.get(attempt.userId);
    if (!current || compareScores(round.item.gameKey, attempt, current) < 0) {
      bestByUser.set(attempt.userId, attempt);
    }
  }

  const ranked = Array.from(bestByUser.values())
    .sort((a, b) => compareScores(round.item.gameKey, a, b))
    .slice(0, 3);

  if (ranked.some(finalistNeedsReview)) {
    await prisma.itemRound.update({
      where: { id: roundId },
      data: {
        state: "REVIEW",
        winnerUserId: null,
      },
    });

    // Keep item closed until manual review resolves the finalists.
    await prisma.item.update({
      where: { id: round.itemId },
      data: { state: "CLOSED", closesAt: round.closesAt ?? round.fundingEndsAt },
    });

    return {
      ok: true,
      roundId,
      itemId: round.itemId,
      winnersPublished: false,
      uniquePlayers: bestByUser.size,
      winnersCount: 0,
    };
  }

  const users = ranked.length
    ? await prisma.user.findMany({
        where: { id: { in: ranked.map((r) => r.userId) } },
        select: { id: true, alias: true, email: true },
      })
    : [];
  const aliasById = new Map(
    users.map((u) => [u.id, (u.alias && u.alias.trim()) || (u.email?.split("@")[0] ?? "player")]),
  );

  await prisma.$transaction(async (tx) => {
    for (let idx = 0; idx < ranked.length; idx += 1) {
      const row = ranked[idx]!;
      const bonus = COMPLETED_ROUND_BONUSES[idx] ?? 0;
      const rewardType = idx === 0 ? "ITEM" : "CREDIT_BONUS";
      await tx.winner.create({
        data: {
          itemId: round.itemId,
          roundId,
          dayKey: round.fundingStartsAt.toISOString().slice(0, 10),
          userId: row.userId,
          rank: idx + 1,
          scoreMs: row.scoreMs,
          alias: aliasById.get(row.userId) ?? "player",
          rewardType,
          rewardCredits: bonus,
        },
      });
      if (bonus > 0) {
        await tx.user.update({
          where: { id: row.userId },
          data: { paidCreditsBalance: { increment: bonus } },
        });
        await tx.creditLedger.create({
          data: {
            userId: row.userId,
            itemId: round.itemId,
            roundId,
            kind: "RUNNER_UP_BONUS",
            credits: bonus,
            note: `${round.item.title} leaderboard bonus for rank ${idx + 1}`,
          },
        });
      }
    }

    await tx.itemRound.update({
      where: { id: roundId },
      data: {
        state: "PUBLISHED",
        purchaseGraceEndsAt: round.purchaseGraceEndsAt ?? new Date(Date.now() + round.item.purchaseGraceHours * 60 * 60 * 1000),
        winnerUserId: ranked[0]?.userId ?? null,
      },
    });
    await tx.item.update({
      where: { id: round.itemId },
      data: { state: "PUBLISHED", closesAt: round.closesAt ?? round.fundingEndsAt },
    });
  });

  return {
    ok: true,
    roundId,
    itemId: round.itemId,
    winnersPublished: ranked.length > 0,
    uniquePlayers: bestByUser.size,
    winnersCount: ranked.length,
  };
}

export async function settleItemWinners(itemId: string): Promise<LegacySettleResult> {
  const latestRound = await prisma.itemRound.findFirst({ where: { itemId }, orderBy: [{ sequence: "desc" }] });
  if (latestRound) {
    const res = await settleRound(latestRound.id);
    return {
      ok: res.ok,
      dayKey: latestRound.fundingStartsAt.toISOString().slice(0, 10),
      itemId,
      winnersPublished: res.winnersPublished,
      pct: DEFAULT_TOP_PCT,
      pctLabel: "5%",
      uniquePlayers: res.uniquePlayers,
      winnersCount: res.winnersCount,
      cutoffRank: res.winnersCount,
    };
  }

  const dayKey = dayKeyZA();
  return {
    ok: true,
    dayKey,
    itemId,
    winnersPublished: false,
    pct: DEFAULT_TOP_PCT,
    pctLabel: "5%",
    uniquePlayers: 0,
    winnersCount: 0,
    cutoffRank: 0,
  };
}
