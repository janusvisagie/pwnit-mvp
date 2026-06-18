// src/lib/adminCampaign.ts
// Admin-only operations for the campaign lifecycle, audit ledgers, and archive snapshots.
// EVERY caller must verify admin first (requireAdmin/assertAdmin from @/lib/admin) — these
// functions trust the adminUserId they are given and write AdminAuditLog rows for actions.

import { prisma } from "@/lib/db";
import { compareScores } from "@/lib/gameRules";
import { activationTargetCreditsForItem } from "@/lib/playCost";
import { logCreditTx, logDiscountTx, type Tx } from "@/lib/ledger";
import {
  ALLOWED_TRANSITIONS,
  ARCHIVABLE_STATES,
  CANCELLABLE_STATES,
  assertTransition,
  isKnownState,
} from "@/lib/campaignLifecycle";

export type AdminMeta = { adminUserId: string; ip?: string | null; userAgent?: string | null };

function reqReason(reason?: string | null): string {
  const r = String(reason ?? "").trim();
  if (!r) throw new Error("reason_required");
  return r;
}

async function writeAudit(
  tx: Tx,
  meta: AdminMeta,
  action: string,
  entityType: string,
  entityId: string,
  opts: { before?: unknown; after?: unknown; reason?: string | null } = {},
) {
  return (tx as any).adminAuditLog.create({
    data: {
      adminUserId: meta.adminUserId,
      action,
      entityType,
      entityId,
      beforeJson: opts.before === undefined ? null : JSON.stringify(opts.before),
      afterJson: opts.after === undefined ? null : JSON.stringify(opts.after),
      reason: opts.reason ?? null,
      ipAddress: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
    },
  });
}

/** Display score for a stored scoreMs (pwnit2 gauntlet stores 1_000_000 - gameScore). */
function gameScoreFromScoreMs(gameKey: string | null | undefined, scoreMs: number): number {
  if (String(gameKey ?? "").startsWith("pwnit2:")) return Math.max(0, 1_000_000 - Number(scoreMs || 0));
  return Number(scoreMs || 0);
}

function roundSummary(round: any) {
  return {
    state: round.state,
    winnerUserId: round.winnerUserId ?? null,
    winningScore: round.winningScore ?? null,
    closedAt: round.closedAt ?? null,
    expiredAt: round.expiredAt ?? null,
    archivedAt: round.archivedAt ?? null,
    cancelledAt: round.cancelledAt ?? null,
    purchaseGraceEndsAt: round.purchaseGraceEndsAt ?? null,
    statusReason: round.statusReason ?? null,
  };
}

const VALID_ATTEMPT_WHERE = { OR: [{ flags: null }, { NOT: { flags: { contains: '"valid":false' } } }] } as const;

/** Best valid attempt per user, ranked best-first (same comparator the settle flow uses). */
async function rankedAttempts(tx: Tx, roundId: string, gameKey: string | null | undefined, take = 20) {
  const attempts = await (tx as any).attempt.findMany({
    where: { roundId, ...VALID_ATTEMPT_WHERE },
    select: { userId: true, scoreMs: true, createdAt: true },
    orderBy: [{ createdAt: "asc" }],
  });
  const bestByUser = new Map<string, any>();
  for (const a of attempts) {
    const cur = bestByUser.get(a.userId);
    if (!cur || compareScores(gameKey as any, a, cur) < 0) bestByUser.set(a.userId, a);
  }
  return Array.from(bestByUser.values())
    .sort((a, b) => compareScores(gameKey as any, a, b))
    .slice(0, take);
}

async function aliasMapFor(tx: Tx, userIds: string[]) {
  if (!userIds.length) return new Map<string, string>();
  const users = await (tx as any).user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, alias: true, email: true },
  });
  return new Map<string, string>(
    users.map((u: any) => [u.id, (u.alias && u.alias.trim()) || (u.email?.split("@")[0] ?? "player")]),
  );
}

/** Remaining (unredeemed, unexpired) discount per user for a round: Σ attempt.paidUsed − Σ |negative ledger amounts|. */
async function remainingDiscountByUser(tx: Tx, itemId: string, roundId: string) {
  const earned = await (tx as any).attempt.groupBy({
    by: ["userId"],
    where: { roundId, paidUsed: { gt: 0 } },
    _sum: { paidUsed: true },
  });
  const negatives = await (tx as any).discountLedger.groupBy({
    by: ["userId"],
    where: { itemId, roundId, amount: { lt: 0 } },
    _sum: { amount: true },
  });
  const negByUser = new Map<string, number>(negatives.map((n: any) => [n.userId, Number(n._sum?.amount ?? 0)]));
  const remaining = new Map<string, number>();
  for (const row of earned) {
    const rem = Number(row._sum?.paidUsed ?? 0) + (negByUser.get(row.userId) ?? 0); // neg sum is negative
    if (rem > 0) remaining.set(row.userId, rem);
  }
  return remaining;
}

async function resolveUser(idOrEmail: string) {
  const key = String(idOrEmail ?? "").trim();
  if (!key) throw new Error("user_required");
  const user = key.includes("@")
    ? await prisma.user.findFirst({ where: { email: key.toLowerCase() }, select: { id: true, email: true, alias: true } })
    : await prisma.user.findUnique({ where: { id: key }, select: { id: true, email: true, alias: true } });
  if (!user) throw new Error("user_not_found");
  return user;
}

// ───────────────────────────── Listing ─────────────────────────────

export async function listAdminCampaigns() {
  const items = await prisma.item.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      state: true,
      tier: true,
      prizeValueZAR: true,
      playCostCredits: true,
      activationGoalEntries: true,
      gameKey: true,
      rounds: {
        orderBy: { sequence: "desc" },
        take: 5,
        select: {
          id: true,
          sequence: true,
          state: true,
          attemptCount: true,
          paidCreditsCollected: true,
          freeCreditsCollected: true,
          activationTargetCredits: true,
          activatedAt: true,
          closesAt: true,
          closedAt: true,
          expiredAt: true,
          archivedAt: true,
          cancelledAt: true,
          purchaseGraceEndsAt: true,
          winnerUserId: true,
          winningScore: true,
          statusReason: true,
        },
      },
    },
  });

  return items.map((item) => ({
    ...item,
    rounds: item.rounds.map((r: any) => ({
      ...r,
      allowedTargets: isKnownState(String(r.state)) ? ALLOWED_TRANSITIONS[r.state as keyof typeof ALLOWED_TRANSITIONS] : [],
      archivable: (ARCHIVABLE_STATES as readonly string[]).includes(String(r.state)),
      cancellable: (CANCELLABLE_STATES as readonly string[]).includes(String(r.state)),
    })),
  }));
}

// ───────────────────────────── Drafts ─────────────────────────────

export async function createDraftCampaign(
  meta: AdminMeta,
  input: {
    title: string;
    prizeValueZAR: number;
    playCostCredits?: number;
    activationGoalEntries?: number;
    countdownMinutes?: number;
    purchaseGraceHours?: number;
    shortDesc?: string;
    imageUrl?: string;
  },
) {
  const title = String(input.title ?? "").trim();
  if (!title) throw new Error("title_required");
  const prizeValueZAR = Math.max(1, Math.floor(Number(input.prizeValueZAR || 0)));
  const playCostCredits = Math.max(1, Math.floor(Number(input.playCostCredits ?? 5)));
  const activationGoalEntries = Math.max(1, Math.floor(Number(input.activationGoalEntries ?? 20)));
  const suffix = Date.now().toString(36);

  return prisma.$transaction(async (tx) => {
    const item = await tx.item.create({
      data: {
        title,
        tier: 1,
        prizeType: "VOUCHER",
        prizeValueZAR,
        playCostCredits,
        activationGoalEntries,
        countdownMinutes: Math.max(1, Math.floor(Number(input.countdownMinutes ?? 30))),
        purchaseGraceHours: Math.max(1, Math.floor(Number(input.purchaseGraceHours ?? 24))),
        fundingWindowHours: 168,
        state: "DRAFT",
        shortDesc: input.shortDesc?.trim() || null,
        imageUrl: input.imageUrl?.trim() || null,
        gameKey: `pwnit2:custom-${suffix}`,
        sortOrder: 99,
      } as any,
    });

    const now = new Date();
    const round = await tx.itemRound.create({
      data: {
        itemId: item.id,
        sequence: 1,
        state: "DRAFT",
        fundingStartsAt: now,
        fundingEndsAt: new Date(now.getTime() + 168 * 3600_000),
        activationTargetCredits: activationTargetCreditsForItem(item as any),
        purchaseGraceEndsAt: new Date(now.getTime() + 24 * 3600_000),
      } as any,
    });

    await writeAudit(tx, meta, "CAMPAIGN_CREATED", "ItemRound", round.id, {
      after: { itemId: item.id, title, prizeValueZAR, playCostCredits, activationGoalEntries },
    });
    return { itemId: item.id, roundId: round.id };
  });
}

export async function updateDraftCampaign(
  meta: AdminMeta,
  input: { roundId: string; title?: string; prizeValueZAR?: number; playCostCredits?: number; activationGoalEntries?: number; imageUrl?: string },
) {
  return prisma.$transaction(async (tx) => {
    const round = await tx.itemRound.findUnique({ where: { id: input.roundId }, include: { item: true } });
    if (!round) throw new Error("round_not_found");
    if (round.state !== "DRAFT") throw new Error("only_drafts_editable");

    const before = { title: round.item.title, prizeValueZAR: round.item.prizeValueZAR, playCostCredits: round.item.playCostCredits, activationGoalEntries: round.item.activationGoalEntries };
    const data: any = {};
    if (input.title !== undefined) data.title = String(input.title).trim() || round.item.title;
    if (input.prizeValueZAR !== undefined) data.prizeValueZAR = Math.max(1, Math.floor(Number(input.prizeValueZAR)));
    if (input.playCostCredits !== undefined) data.playCostCredits = Math.max(1, Math.floor(Number(input.playCostCredits)));
    if (input.activationGoalEntries !== undefined) data.activationGoalEntries = Math.max(1, Math.floor(Number(input.activationGoalEntries)));
    if (input.imageUrl !== undefined) data.imageUrl = String(input.imageUrl).trim() || null;

    const item = await tx.item.update({ where: { id: round.itemId }, data });
    await tx.itemRound.update({
      where: { id: round.id },
      data: { activationTargetCredits: activationTargetCreditsForItem(item as any) } as any,
    });
    await writeAudit(tx, meta, "CAMPAIGN_UPDATED", "ItemRound", round.id, { before, after: data });
    return { ok: true };
  });
}

// ─────────────────────── Lifecycle transitions ───────────────────────

export async function transitionRound(
  meta: AdminMeta,
  input: { roundId: string; action: string; reason?: string; hours?: number },
) {
  const { roundId, action } = input;

  return prisma.$transaction(async (tx) => {
    const round = await tx.itemRound.findUnique({ where: { id: roundId }, include: { item: true } });
    if (!round) throw new Error("round_not_found");
    const item = round.item;
    const before = roundSummary(round);
    const now = new Date();
    const reason = String(input.reason ?? "").trim() || null;

    // Not a state change: (re)open / extend the purchase window.
    if (action === "open_purchase_window") {
      if (!["CLOSED", "REVIEW", "PUBLISHED"].includes(String(round.state))) throw new Error("window_requires_closed");
      const hours = Math.max(1, Math.floor(Number(input.hours ?? item.purchaseGraceHours ?? 24)));
      const updated = await tx.itemRound.update({
        where: { id: roundId },
        data: { purchaseGraceEndsAt: new Date(now.getTime() + hours * 3600_000), statusReason: reason } as any,
      });
      await writeAudit(tx, meta, "PURCHASE_WINDOW_OPENED", "ItemRound", roundId, { before, after: roundSummary(updated), reason });
      return { ok: true, state: updated.state };
    }

    const TARGETS: Record<string, string> = {
      publish_draft: "BUILDING",
      activate: "ACTIVATED",
      close: "CLOSED",
      publish_results: "PUBLISHED",
      expire: "EXPIRED",
      archive: "ARCHIVED",
      cancel: "CANCELLED",
    };
    const to = TARGETS[action];
    if (!to) throw new Error("unknown_action");
    assertTransition(String(round.state), to);

    if (action === "publish_draft") {
      const updated = await tx.itemRound.update({
        where: { id: roundId },
        data: {
          state: "BUILDING",
          fundingStartsAt: now,
          fundingEndsAt: new Date(now.getTime() + (item.fundingWindowHours ?? 168) * 3600_000),
          activationTargetCredits: activationTargetCreditsForItem(item as any),
          statusReason: reason,
        } as any,
      });
      await tx.item.update({ where: { id: item.id }, data: { state: "OPEN", opensAt: now, closesAt: null } });
      await writeAudit(tx, meta, "CAMPAIGN_STATUS_CHANGED", "ItemRound", roundId, { before, after: roundSummary(updated), reason });
      return { ok: true, state: updated.state };
    }

    if (action === "activate") {
      const closesAt = new Date(now.getTime() + (item.countdownMinutes ?? 30) * 60_000);
      const updated = await tx.itemRound.update({
        where: { id: roundId },
        data: {
          state: "ACTIVATED",
          activatedAt: now,
          closesAt,
          purchaseGraceEndsAt: new Date(closesAt.getTime() + (item.purchaseGraceHours ?? 24) * 3600_000),
          statusReason: reason,
        } as any,
      });
      await tx.item.update({ where: { id: item.id }, data: { state: "ACTIVATED", closesAt } });
      await writeAudit(tx, meta, "CAMPAIGN_STATUS_CHANGED", "ItemRound", roundId, { before, after: roundSummary(updated), reason });
      return { ok: true, state: updated.state };
    }

    if (action === "close") {
      const top = (await rankedAttempts(tx, roundId, item.gameKey, 1))[0] ?? null;
      const updated = await tx.itemRound.update({
        where: { id: roundId },
        data: {
          state: "CLOSED",
          closedAt: now,
          winnerUserId: top?.userId ?? null,
          winningScore: top ? gameScoreFromScoreMs(item.gameKey, top.scoreMs) : null,
          statusReason: reason,
        } as any,
      });
      await tx.item.update({ where: { id: item.id }, data: { state: "CLOSED", closesAt: round.closesAt ?? now } });
      await writeAudit(tx, meta, "CAMPAIGN_CLOSED", "ItemRound", roundId, { before, after: roundSummary(updated), reason });
      if (top) {
        await writeAudit(tx, meta, "WINNER_LOCKED", "ItemRound", roundId, {
          after: { winnerUserId: top.userId, winningScore: gameScoreFromScoreMs(item.gameKey, top.scoreMs) },
        });
      }
      return { ok: true, state: updated.state };
    }

    if (action === "publish_results") {
      // Manual resolution of a round under REVIEW: lock winners + pay podium credit bonuses,
      // mirroring the automatic settle flow (skipped if Winner rows already exist).
      const existing = await tx.winner.count({ where: { roundId } });
      const ranked = await rankedAttempts(tx, roundId, item.gameKey, 3);
      const aliases = await aliasMapFor(tx, ranked.map((r: any) => r.userId));
      const bonuses = [0, 20, 10];
      if (existing === 0) {
        for (let idx = 0; idx < ranked.length; idx += 1) {
          const row: any = ranked[idx];
          const bonus = bonuses[idx] ?? 0;
          await tx.winner.create({
            data: {
              itemId: item.id,
              roundId,
              dayKey: round.fundingStartsAt.toISOString().slice(0, 10),
              userId: row.userId,
              rank: idx + 1,
              scoreMs: row.scoreMs,
              alias: aliases.get(row.userId) ?? "player",
              rewardType: idx === 0 ? "ITEM" : "CREDIT_BONUS",
              rewardCredits: bonus,
            },
          });
          if (bonus > 0) {
            await tx.user.update({ where: { id: row.userId }, data: { paidCreditsBalance: { increment: bonus } } });
            await logCreditTx(tx, {
              userId: row.userId,
              kind: "RUNNER_UP_BONUS",
              credits: bonus,
              itemId: item.id,
              roundId,
              source: "ADMIN_PUBLISH",
              adminUserId: meta.adminUserId,
              note: `${item.title} leaderboard bonus for rank ${idx + 1}`,
            });
          }
        }
      }
      const top: any = ranked[0] ?? null;
      const updated = await tx.itemRound.update({
        where: { id: roundId },
        data: {
          state: "PUBLISHED",
          winnerUserId: top?.userId ?? round.winnerUserId ?? null,
          winningScore: top ? gameScoreFromScoreMs(item.gameKey, top.scoreMs) : round.winningScore ?? null,
          statusReason: reason,
        } as any,
      });
      await writeAudit(tx, meta, "WINNER_LOCKED", "ItemRound", roundId, { before, after: roundSummary(updated), reason });
      return { ok: true, state: updated.state };
    }

    if (action === "expire") {
      const remaining = await remainingDiscountByUser(tx, item.id, roundId);
      let totalExpired = 0;
      for (const [userId, amount] of remaining.entries()) {
        await logDiscountTx(tx, {
          userId,
          itemId: item.id,
          roundId,
          type: "DISCOUNT_EXPIRED",
          amount: -amount,
          source: "CAMPAIGN_EXPIRED",
          adminUserId: meta.adminUserId,
          note: `Campaign expired — R${amount} unredeemed discount expired`,
        });
        totalExpired += amount;
      }
      const updated = await tx.itemRound.update({
        where: { id: roundId },
        data: { state: "EXPIRED", expiredAt: now, statusReason: reason } as any,
      });
      await tx.item.update({ where: { id: item.id }, data: { state: "EXPIRED" } });
      await writeAudit(tx, meta, "DISCOUNTS_EXPIRED", "ItemRound", roundId, {
        after: { users: remaining.size, totalExpiredZAR: totalExpired },
      });
      await writeAudit(tx, meta, "CAMPAIGN_STATUS_CHANGED", "ItemRound", roundId, { before, after: roundSummary(updated), reason });
      return { ok: true, state: updated.state, expired: { users: remaining.size, totalExpiredZAR: totalExpired } };
    }

    if (action === "archive") {
      const ranked = await rankedAttempts(tx, roundId, item.gameKey, 20);
      const aliases = await aliasMapFor(tx, ranked.map((r: any) => r.userId));
      const leaderboard = ranked.map((r: any, i: number) => ({
        rank: i + 1,
        userId: r.userId,
        alias: aliases.get(r.userId) ?? "player",
        scoreMs: r.scoreMs,
        score: gameScoreFromScoreMs(item.gameKey, r.scoreMs),
      }));

      const earnedAgg = await (tx as any).attempt.aggregate({ where: { roundId }, _sum: { paidUsed: true, freeUsed: true } });
      const redeemedAgg = await (tx as any).itemPurchase.aggregate({ where: { roundId }, _sum: { discountCredits: true }, _count: { _all: true } });
      const expiredAgg = await (tx as any).discountLedger.aggregate({ where: { roundId, type: "DISCOUNT_EXPIRED" }, _sum: { amount: true } });

      const top = leaderboard[0] ?? null;
      const winnerUserId = round.winnerUserId ?? top?.userId ?? null;
      const winningScore = round.winningScore ?? top?.score ?? null;

      const snapshot = await (tx as any).campaignArchiveSnapshot.create({
        data: {
          itemId: item.id,
          roundId,
          archivedAt: now,
          finalStatus: String(round.state),
          finalVoucherValueZAR: Number(item.prizeValueZAR ?? 0),
          winnerUserId,
          winningScore,
          finalLeaderboardJson: JSON.stringify(leaderboard),
          totalPaidCreditsSpent: Number(earnedAgg?._sum?.paidUsed ?? 0),
          totalFreeCreditsSpent: Number(earnedAgg?._sum?.freeUsed ?? 0),
          totalDiscountEarned: Number(earnedAgg?._sum?.paidUsed ?? 0),
          totalDiscountRedeemed: Number(redeemedAgg?._sum?.discountCredits ?? 0),
          totalDiscountExpired: Math.abs(Number(expiredAgg?._sum?.amount ?? 0)),
          totalPurchases: Number(redeemedAgg?._count?._all ?? 0),
          archivedByUserId: meta.adminUserId,
          notes: reason,
        },
      });

      const updated = await tx.itemRound.update({
        where: { id: roundId },
        data: { state: "ARCHIVED", archivedAt: now, winnerUserId, winningScore, statusReason: reason } as any,
      });
      await tx.item.update({ where: { id: item.id }, data: { state: "ARCHIVED" } });
      await writeAudit(tx, meta, "CAMPAIGN_ARCHIVED", "ItemRound", roundId, {
        before,
        after: { ...roundSummary(updated), snapshotId: snapshot.id },
        reason,
      });
      return { ok: true, state: updated.state, snapshotId: snapshot.id };
    }

    if (action === "cancel") {
      const why = reqReason(input.reason);

      // Ledger-backed refunds of paid spend (idempotent: skip users already refunded for this round).
      const paidByUser = await (tx as any).attempt.groupBy({
        by: ["userId"],
        where: { roundId, paidUsed: { gt: 0 } },
        _sum: { paidUsed: true },
      });
      const alreadyRefunded = await (tx as any).creditLedger.findMany({
        where: { roundId, kind: "CREDIT_REFUND" },
        select: { userId: true },
      });
      const refundedSet = new Set(alreadyRefunded.map((r: any) => r.userId));
      let refundedUsers = 0;
      let refundedTotal = 0;
      for (const row of paidByUser) {
        const credits = Number(row._sum?.paidUsed ?? 0);
        if (credits <= 0 || refundedSet.has(row.userId)) continue;
        await tx.user.update({ where: { id: row.userId }, data: { paidCreditsBalance: { increment: credits } } });
        await logCreditTx(tx, {
          userId: row.userId,
          kind: "CREDIT_REFUND",
          credits,
          itemId: item.id,
          roundId,
          source: "CAMPAIGN_CANCELLED",
          adminUserId: meta.adminUserId,
          note: `Refund: ${item.title} cancelled — ${why}`,
        });
        refundedUsers += 1;
        refundedTotal += credits;
      }

      // Zero out any remaining campaign discount (it was refunded as credits instead).
      const remaining = await remainingDiscountByUser(tx, item.id, roundId);
      for (const [userId, amount] of remaining.entries()) {
        await logDiscountTx(tx, {
          userId,
          itemId: item.id,
          roundId,
          type: "DISCOUNT_REFUNDED",
          amount: -amount,
          source: "CAMPAIGN_CANCELLED",
          adminUserId: meta.adminUserId,
          note: `Campaign cancelled — discount reversed (paid spend refunded as credits)`,
        });
      }

      const updated = await tx.itemRound.update({
        where: { id: roundId },
        data: { state: "CANCELLED", cancelledAt: now, statusReason: why } as any,
      });
      await tx.item.update({ where: { id: item.id }, data: { state: "CANCELLED" } });
      await writeAudit(tx, meta, "CAMPAIGN_CANCELLED", "ItemRound", roundId, {
        before,
        after: { ...roundSummary(updated), refundedUsers, refundedTotalZAR: refundedTotal },
        reason: why,
      });
      return { ok: true, state: updated.state, refunded: { users: refundedUsers, totalZAR: refundedTotal } };
    }

    throw new Error("unknown_action");
  });
}

// ───────────────────────────── Adjustments ─────────────────────────────
export async function startNextRound(meta: AdminMeta, input: { roundId: string }) {
  return prisma.$transaction(async (tx) => {
    const round = await tx.itemRound.findUnique({ where: { id: input.roundId }, include: { item: true } });
    if (!round) throw new Error("round_not_found");
    const item = round.item;

    // Must be the latest round for this item, and PUBLISHED (a winner was announced).
    const latest = await tx.itemRound.findFirst({
      where: { itemId: item.id },
      orderBy: { sequence: "desc" },
      select: { id: true, sequence: true },
    });
    if (!latest || latest.id !== round.id) throw new Error("not_latest_round");
    if (round.state !== "PUBLISHED") throw new Error("requires_published");

    const now = new Date();
    const nextSequence = Number(round.sequence) + 1;
    const fresh = await tx.itemRound.create({
      data: {
        itemId: item.id,
        sequence: nextSequence,
        state: "BUILDING",
        fundingStartsAt: now,
        fundingEndsAt: new Date(now.getTime() + (item.fundingWindowHours ?? 168) * 3600_000),
        activationTargetCredits: activationTargetCreditsForItem(item as any),
        purchaseGraceEndsAt: new Date(now.getTime() + (item.purchaseGraceHours ?? 24) * 3600_000),
      } as any,
    });
    await tx.item.update({ where: { id: item.id }, data: { state: "OPEN", opensAt: now, closesAt: null } });

    await writeAudit(tx, meta, "NEXT_ROUND_STARTED", "ItemRound", fresh.id, {
      before: { fromRoundId: round.id, fromSequence: round.sequence },
      after: { roundId: fresh.id, sequence: nextSequence },
    });
    return { ok: true, roundId: fresh.id, sequence: nextSequence };
  });
}
export async function adjustUserCredits(meta: AdminMeta, input: { user: string; deltaCredits: number; reason?: string }) {
  const why = reqReason(input.reason);
  const delta = Math.trunc(Number(input.deltaCredits || 0));
  if (!delta) throw new Error("delta_required");
  const user = await resolveUser(input.user);

  return prisma.$transaction(async (tx) => {
    const beforeU = await tx.user.findUnique({
      where: { id: user.id },
      select: { freeCreditsBalance: true, paidCreditsBalance: true },
    });
    const beforePaid = Number(beforeU?.paidCreditsBalance ?? 0);
    if (beforePaid + delta < 0) throw new Error("would_go_negative");

    const after = await tx.user.update({
      where: { id: user.id },
      data: { paidCreditsBalance: { increment: delta } },
      select: { freeCreditsBalance: true, paidCreditsBalance: true },
    });
    await logCreditTx(tx, {
      userId: user.id,
      kind: "ADMIN_ADJUSTMENT",
      credits: delta,
      balanceAfter: Number(after.freeCreditsBalance ?? 0) + Number(after.paidCreditsBalance ?? 0),
      adminUserId: meta.adminUserId,
      source: "ADMIN",
      note: why,
    });
    await writeAudit(tx, meta, "CREDIT_ADJUSTED", "User", user.id, {
      before: { paid: beforePaid },
      after: { paid: Number(after.paidCreditsBalance ?? 0), delta },
      reason: why,
    });
    return { ok: true, user: user.email, paidAfter: Number(after.paidCreditsBalance ?? 0) };
  });
}

export async function adjustUserDiscount(
  meta: AdminMeta,
  input: { user: string; itemId: string; roundId?: string | null; deltaZAR: number; reason?: string },
) {
  const why = reqReason(input.reason);
  const delta = Math.trunc(Number(input.deltaZAR || 0));
  if (!delta) throw new Error("delta_required");
  if (!input.itemId) throw new Error("item_required");
  const user = await resolveUser(input.user);

  return prisma.$transaction(async (tx) => {
    const row = await logDiscountTx(tx, {
      userId: user.id,
      itemId: input.itemId,
      roundId: input.roundId ?? null,
      type: "ADMIN_ADJUSTMENT",
      amount: delta,
      adminUserId: meta.adminUserId,
      source: "ADMIN",
      note: why,
    });
    await writeAudit(tx, meta, "DISCOUNT_ADJUSTED", "User", user.id, {
      after: { itemId: input.itemId, roundId: input.roundId ?? null, delta, balanceAfter: row.balanceAfter },
      reason: why,
    });
    return { ok: true, user: user.email, balanceAfter: row.balanceAfter };
  });
}

// ─────────────────────── Ledger / audit / archive reads ───────────────────────

export async function searchLedger(input: {
  ledger: "credit" | "discount";
  user?: string;
  itemId?: string;
  roundId?: string;
  kind?: string;
  limit?: number;
}) {
  const take = Math.min(200, Math.max(1, Math.floor(Number(input.limit ?? 50))));
  const where: any = {};
  if (input.user) where.userId = (await resolveUser(input.user)).id;
  if (input.itemId) where.itemId = input.itemId;
  if (input.roundId) where.roundId = input.roundId;

  if (input.ledger === "discount") {
    if (input.kind) where.type = input.kind;
    const rows = await (prisma as any).discountLedger.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      include: { user: { select: { email: true, alias: true } }, item: { select: { title: true } } },
    });
    return rows;
  }
  if (input.kind) where.kind = input.kind;
  return prisma.creditLedger.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take,
    include: { user: { select: { email: true, alias: true } } } as any,
  });
}

export async function listAuditLog(input: { limit?: number; entityType?: string; entityId?: string } = {}) {
  const take = Math.min(200, Math.max(1, Math.floor(Number(input.limit ?? 100))));
  const where: any = {};
  if (input.entityType) where.entityType = input.entityType;
  if (input.entityId) where.entityId = input.entityId;
  return (prisma as any).adminAuditLog.findMany({ where, orderBy: { createdAt: "desc" }, take });
}

export async function listArchiveSnapshots() {
  return (prisma as any).campaignArchiveSnapshot.findMany({
    orderBy: { archivedAt: "desc" },
    take: 100,
    include: { item: { select: { title: true } } },
  });
}

export async function updateSnapshotNotes(meta: AdminMeta, input: { snapshotId: string; notes: string }) {
  const snapshot = await (prisma as any).campaignArchiveSnapshot.update({
    where: { id: input.snapshotId },
    data: { notes: String(input.notes ?? "").trim() || null },
  });
  await writeAudit(prisma, meta, "CAMPAIGN_UPDATED", "CampaignArchiveSnapshot", input.snapshotId, {
    after: { notes: snapshot.notes },
  });
  return { ok: true };
}
