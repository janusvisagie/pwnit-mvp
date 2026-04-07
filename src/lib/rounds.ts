
import { prisma } from "@/lib/db";
import { settleRound } from "@/lib/settle";
import { compareScores, publicProgressPct, publicStageLabel } from "@/lib/gameRules";

export const ROUND_STATES = {
  BUILDING: "BUILDING",
  ACTIVATED: "ACTIVATED",
  CLOSED: "CLOSED",
  REVIEW: "REVIEW",
  PUBLISHED: "PUBLISHED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;

export function activationTargetForItem(item: {
  landedCostZAR?: number | null;
  prizeValueZAR: number;
  allowedSubsidyCredits?: number | null;
}) {
  const landed = Math.max(0, Number(item.landedCostZAR ?? item.prizeValueZAR ?? 0));
  const subsidy = Math.max(0, Number(item.allowedSubsidyCredits ?? 0));
  return Math.max(1, landed - subsidy);
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + Math.max(0, hours) * 60 * 60 * 1000);
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + Math.max(0, minutes) * 60 * 1000);
}

export async function getCurrentRound(itemId: string) {
  return prisma.itemRound.findFirst({
    where: { itemId },
    orderBy: [{ sequence: "desc" }],
  });
}

async function createFreshRound(item: any, sequence: number) {
  const now = new Date();
  const round = await prisma.itemRound.create({
    data: {
      itemId: item.id,
      sequence,
      state: ROUND_STATES.BUILDING,
      fundingStartsAt: now,
      fundingEndsAt: addHours(now, item.fundingWindowHours),
      activationTargetCredits: activationTargetForItem(item),
      purchaseGraceEndsAt: addHours(now, item.purchaseGraceHours),
    },
  });
  await prisma.item.update({
    where: { id: item.id },
    data: { state: "OPEN", opensAt: now, closesAt: null },
  });
  return round;
}

export async function ensureCurrentRound(itemId: string) {
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return null;

  let round = await getCurrentRound(itemId);
  if (!round) {
    return createFreshRound(item, 1);
  }

  if (round.state === ROUND_STATES.CLOSED) {
    await settleRound(round.id);
    round = await getCurrentRound(itemId);
    if (!round) {
      return createFreshRound(item, 1);
    }
  }

  // REVIEW is terminal until a deliberate admin action resolves it.
  // Do not auto-create a new round after publish/fail/refund/review.
  return round;
}

async function applyFailedRefunds(roundId: string) {
  const round = await prisma.itemRound.findUnique({
    where: { id: roundId },
    include: { item: true },
  });
  if (!round) return;

  const rewardCount = await prisma.creditLedger.count({
    where: { roundId, kind: "FAILED_ROUND_REFUND" },
  });
  if (rewardCount > 0) {
    await prisma.itemRound.update({
      where: { id: roundId },
      data: { state: ROUND_STATES.REFUNDED },
    });
    await prisma.item.update({
      where: { id: round.itemId },
      data: { state: "FAILED", closesAt: round.fundingEndsAt },
    });
    return;
  }

  const attempts = await prisma.attempt.findMany({
    where: { roundId, paidUsed: { gt: 0 } },
    select: { userId: true, paidUsed: true },
  });

  const refundByUser = new Map<string, number>();
  for (const attempt of attempts) {
    refundByUser.set(attempt.userId, (refundByUser.get(attempt.userId) ?? 0) + Number(attempt.paidUsed || 0));
  }

  await prisma.$transaction(async (tx) => {
    for (const [userId, credits] of refundByUser.entries()) {
      if (credits <= 0) continue;
      await tx.user.update({
        where: { id: userId },
        data: { paidCreditsBalance: { increment: credits } },
      });
      await tx.creditLedger.create({
        data: {
          userId,
          itemId: round.itemId,
          roundId,
          kind: "FAILED_ROUND_REFUND",
          credits,
          note: `Refund for ${round.item.title} round that did not activate`,
        },
      });
    }

    const leaderboardAttempts = await tx.attempt.findMany({
      where: {
        roundId,
        OR: [{ flags: null }, { NOT: { flags: { contains: '"valid":false' } } }],
      },
      orderBy: [{ createdAt: "asc" }],
      select: { userId: true, scoreMs: true, createdAt: true },
    });

    const bestByUser = new Map();
    for (const row of leaderboardAttempts) {
      const current = bestByUser.get(row.userId);
      if (!current || compareScores(round.item.gameKey, row, current) < 0) {
        bestByUser.set(row.userId, row);
      }
    }

    const ranked = Array.from(bestByUser.values())
      .sort((a, b) => compareScores(round.item.gameKey, a, b))
      .slice(0, 3);

    const failedBonuses = [10, 5, 5];
    const userIds = ranked.map((r: any) => r.userId);
    const users = userIds.length
      ? await tx.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, alias: true, email: true },
        })
      : [];
    const aliasMap = new Map(users.map((u) => [u.id, (u.alias && u.alias.trim()) || u.email.split("@")[0]]));

    for (let idx = 0; idx < ranked.length; idx += 1) {
      const winner: any = ranked[idx];
      const bonus = failedBonuses[idx] ?? 0;
      if (bonus > 0) {
        await tx.user.update({
          where: { id: winner.userId },
          data: { paidCreditsBalance: { increment: bonus } },
        });
        await tx.creditLedger.create({
          data: {
            userId: winner.userId,
            itemId: round.itemId,
            roundId,
            kind: "RUNNER_UP_BONUS",
            credits: bonus,
            note: `Failed activation consolation bonus for ${round.item.title}`,
          },
        });
      }
      await tx.winner.create({
        data: {
          itemId: round.itemId,
          roundId,
          dayKey: round.fundingStartsAt.toISOString().slice(0, 10),
          userId: winner.userId,
          rank: idx + 1,
          scoreMs: winner.scoreMs,
          alias: aliasMap.get(winner.userId) ?? "player",
          rewardType: bonus > 0 ? "CREDIT_BONUS" : "ITEM",
          rewardCredits: bonus,
        },
      });
    }

    await tx.itemRound.update({ where: { id: roundId }, data: { state: ROUND_STATES.REFUNDED } });
    await tx.item.update({ where: { id: round.itemId }, data: { state: "FAILED", closesAt: round.fundingEndsAt } });
  });
}

export async function syncRoundLifecycle(itemId: string) {
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return null;

  let round = await ensureCurrentRound(itemId);
  if (!round) return null;

  const now = new Date();
  if (round.state === ROUND_STATES.BUILDING && round.paidCreditsCollected >= round.activationTargetCredits) {
    const closesAt = addMinutes(now, item.countdownMinutes);
    round = await prisma.itemRound.update({
      where: { id: round.id },
      data: {
        state: ROUND_STATES.ACTIVATED,
        activatedAt: now,
        closesAt,
        purchaseGraceEndsAt: addHours(closesAt, item.purchaseGraceHours),
      },
    });
    await prisma.item.update({ where: { id: item.id }, data: { state: "ACTIVATED", closesAt } });
  }

  if (round.state === ROUND_STATES.ACTIVATED && round.closesAt && now >= round.closesAt) {
    round = await prisma.itemRound.update({ where: { id: round.id }, data: { state: ROUND_STATES.CLOSED } });
    await prisma.item.update({ where: { id: item.id }, data: { state: "CLOSED", closesAt: round.closesAt } });
  }

  if (round.state === ROUND_STATES.CLOSED) {
    await settleRound(round.id);
    round = await prisma.itemRound.findUnique({ where: { id: round.id } });
  }

  return round;
}

export async function syncHomeItems(itemIds?: string[]) {
  const ids =
    itemIds && itemIds.length
      ? itemIds
      : (
          await prisma.item.findMany({
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            select: { id: true },
          })
        ).map((i) => i.id);

  for (const id of ids) {
    await syncRoundLifecycle(id);
  }
}

export function publicProgress(round: {
  paidCreditsCollected: number;
  activationTargetCredits: number;
  state: string;
}) {
  const pct =
    round.state === ROUND_STATES.ACTIVATED || round.state === ROUND_STATES.CLOSED || round.state === ROUND_STATES.PUBLISHED
      ? 100
      : publicProgressPct(round.paidCreditsCollected, round.activationTargetCredits);

  const label =
    round.state === ROUND_STATES.REVIEW
      ? "Under review"
      : round.state === ROUND_STATES.ACTIVATED || round.state === ROUND_STATES.CLOSED || round.state === ROUND_STATES.PUBLISHED
        ? "Activated"
        : publicStageLabel(pct);

  return {
    pct,
    label,
    hot: pct >= 80 && round.state === ROUND_STATES.BUILDING,
  };
}
