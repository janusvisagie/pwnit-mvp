import { prisma } from "@/lib/db";
import { compareScores } from "@/lib/gameRules";

export type SettleResult = {
  ok: boolean;
  roundId: string;
  itemId: string;
  winnersPublished: boolean;
  uniquePlayers: number;
  winnersCount: number;
};

const COMPLETED_ROUND_BONUSES = [0, 20, 10];

function validAttemptWhere() {
  return {
    OR: [{ flags: null }, { NOT: { flags: { contains: '"valid":false' } } }],
  } as const;
}

export async function settleRound(roundId: string): Promise<SettleResult> {
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

  const attempts = await prisma.attempt.findMany({
    where: { roundId, ...validAttemptWhere() },
    select: { userId: true, scoreMs: true, createdAt: true },
    orderBy: [{ createdAt: "asc" }],
  });

  const bestByUser = new Map<string, { userId: string; scoreMs: number; createdAt: Date }>();
  for (const attempt of attempts) {
    const current = bestByUser.get(attempt.userId);
    if (!current || compareScores(round.item.gameKey, attempt, current) < 0) {
      bestByUser.set(attempt.userId, attempt);
    }
  }

  const ranked = Array.from(bestByUser.values())
    .sort((a, b) => compareScores(round.item.gameKey, a, b))
    .slice(0, 3);

  const users = ranked.length
    ? await prisma.user.findMany({
        where: { id: { in: ranked.map((r) => r.userId) } },
        select: { id: true, alias: true, email: true },
      })
    : [];
  const aliasById = new Map(users.map((u) => [u.id, (u.alias && u.alias.trim()) || (u.email?.split("@")[0] ?? "player")]));

  await prisma.$transaction(async (tx) => {
    for (let idx = 0; idx < ranked.length; idx++) {
      const row = ranked[idx];
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

    await tx.item.update({ where: { id: round.itemId }, data: { state: "PUBLISHED", closesAt: round.closesAt ?? round.fundingEndsAt } });
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
