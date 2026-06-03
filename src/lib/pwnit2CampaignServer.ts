import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/auth";
import { dayKeyZA } from "@/lib/time";
import type { Pwnit2CampaignSnapshot, Pwnit2LeaderboardEntry } from "@/lib/pwnit2DemoCampaign";

const ITEM_TITLE = "Checkers Voucher";
const GAME_TITLE = "Number Chain Sprint";
const GAME_KEY = "pwnit-2-number-chain";
const BASE_VALUE_ZAR = 500;
const ACTIVATION_PLAYS = Number(process.env.PWNIT2_ACTIVATION_PLAYS ?? "5");
const COUNTDOWN_MINUTES = Number(process.env.PWNIT2_COUNTDOWN_MINUTES ?? "30");
const STATUS_WINDOW_HOURS = Number(process.env.PWNIT2_STATUS_WINDOW_HOURS ?? "24");
const SCORE_OFFSET = 1_000_000;

const ACTIVE_ROUND_STATES = ["BUILDING", "ACTIVATED", "CLOSED"];

type LeaderboardRow = Pwnit2LeaderboardEntry & { userId?: string };

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function safeDateIso(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function scoreToScoreMs(score: number) {
  return Math.max(1, SCORE_OFFSET - Math.max(0, Math.floor(score)));
}

function scoreMsToScore(scoreMs: number) {
  return Math.max(0, SCORE_OFFSET - Math.max(1, Math.floor(scoreMs)));
}

function aliasForUser(user: { alias?: string | null; email?: string | null; isGuest?: boolean | null }, fallback: string) {
  if (user.alias) return user.alias;
  if (!user.isGuest && user.email) return user.email.split("@")[0] || fallback;
  return fallback;
}

function statusFromRound(round: any): Pwnit2CampaignSnapshot["state"] {
  if (round.state === "ACTIVATED") return "COUNTDOWN";
  if (round.state === "CLOSED") return "STATUS_WINDOW";
  if (round.state === "ARCHIVED") return "ARCHIVED";
  return "FUNDING";
}

function statusLabelFromRound(round: any) {
  if (round.state === "ACTIVATED") return "Countdown";
  if (round.state === "CLOSED") return "Final status";
  if (round.state === "ARCHIVED") return "Archived";
  return "Funding";
}

function statusToneFromRound(round: any): Pwnit2CampaignSnapshot["statusTone"] {
  if (round.state === "ACTIVATED") return "countdown";
  if (round.state === "CLOSED" || round.state === "ARCHIVED") return "closed";
  return "funding";
}

function countdownLabel(round: any) {
  const state = String(round.state || "BUILDING");
  if (state === "BUILDING") return "Unlocks after activation";
  if (state === "ACTIVATED" && round.closesAt) return `Ends ${new Date(round.closesAt).toLocaleString()}`;
  if (state === "CLOSED" && round.purchaseGraceEndsAt) return `Status window until ${new Date(round.purchaseGraceEndsAt).toLocaleString()}`;
  if (state === "ARCHIVED") return "Campaign archived";
  return "Active";
}

async function ensurePwnit2Item() {
  const existing = await prisma.item.findFirst({
    where: { title: ITEM_TITLE },
    orderBy: { createdAt: "asc" },
  });

  if (existing) return existing;

  return prisma.item.create({
    data: {
      title: ITEM_TITLE,
      tier: 1,
      prizeType: "VOUCHER",
      prizeValueZAR: BASE_VALUE_ZAR,
      landedCostZAR: BASE_VALUE_ZAR,
      playCostCredits: 0,
      fundingWindowHours: 168,
      purchaseGraceHours: STATUS_WINDOW_HOURS,
      sortOrder: 1,
      isHero: true,
      shortDesc: "PwnIt 2 single-voucher campaign",
      state: "OPEN",
      activationGoalEntries: ACTIVATION_PLAYS,
      countdownMinutes: COUNTDOWN_MINUTES,
      gameKey: GAME_KEY,
    } as any,
  });
}

async function ensurePwnit2Round(itemId: string) {
  const active = await prisma.itemRound.findFirst({
    where: { itemId, state: { in: ACTIVE_ROUND_STATES } },
    orderBy: { sequence: "desc" },
  });

  if (active) return active;

  const previous = await prisma.itemRound.findFirst({
    where: { itemId },
    orderBy: { sequence: "desc" },
    select: { sequence: true },
  });

  return prisma.itemRound.create({
    data: {
      itemId,
      sequence: Number(previous?.sequence ?? 0) + 1,
      state: "BUILDING",
      fundingEndsAt: addHours(new Date(), 24 * 30),
      activationTargetCredits: ACTIVATION_PLAYS,
      paidCreditsCollected: 0,
      verifiedSubscriberCreditsCollected: 0,
      freeCreditsCollected: 0,
      attemptCount: 0,
    },
  });
}

async function getTopAttemptForRound(itemId: string, roundId: string) {
  const rows = await prisma.attempt.findMany({
    where: { itemId, roundId },
    orderBy: [{ scoreMs: "asc" }, { createdAt: "asc" }],
    take: 1,
    select: { userId: true },
  });
  return rows[0] ?? null;
}

async function syncPwnit2Round(itemId: string, round: any) {
  const now = new Date();

  if (round.state === "BUILDING" && Number(round.attemptCount ?? 0) >= ACTIVATION_PLAYS) {
    return prisma.itemRound.update({
      where: { id: round.id },
      data: {
        state: "ACTIVATED",
        activatedAt: now,
        closesAt: addMinutes(now, COUNTDOWN_MINUTES),
      },
    });
  }

  if (round.state === "ACTIVATED" && round.closesAt && new Date(round.closesAt).getTime() <= now.getTime()) {
    const topAttempt = await getTopAttemptForRound(itemId, round.id);
    return prisma.itemRound.update({
      where: { id: round.id },
      data: {
        state: "CLOSED",
        winnerUserId: topAttempt?.userId ?? null,
        purchaseGraceEndsAt: addHours(now, STATUS_WINDOW_HOURS),
      } as any,
    });
  }

  if (round.state === "CLOSED" && round.purchaseGraceEndsAt && new Date(round.purchaseGraceEndsAt).getTime() <= now.getTime()) {
    return prisma.itemRound.update({
      where: { id: round.id },
      data: { state: "ARCHIVED" },
    });
  }

  return round;
}

async function getLeaderboard(itemId: string, roundId: string, currentUserId?: string | null): Promise<LeaderboardRow[]> {
  const rows = await prisma.attempt.findMany({
    where: { itemId, roundId },
    orderBy: [{ scoreMs: "asc" }, { createdAt: "asc" }],
    select: {
      userId: true,
      scoreMs: true,
      createdAt: true,
      user: { select: { alias: true, email: true, isGuest: true } },
    },
  });

  const bestByUser = new Map<string, any>();
  for (const row of rows as any[]) {
    const current = bestByUser.get(row.userId);
    if (!current || Number(row.scoreMs) < Number(current.scoreMs)) {
      bestByUser.set(row.userId, row);
    }
  }

  return Array.from(bestByUser.values())
    .sort((a, b) => Number(a.scoreMs) - Number(b.scoreMs) || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((row, index) => {
      const score = scoreMsToScore(Number(row.scoreMs));
      return {
        rank: index + 1,
        alias: aliasForUser(row.user, `Player ${index + 1}`),
        score,
        bestTime: new Date(row.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        attempts: rows.filter((r: any) => r.userId === row.userId).length,
        badge: index === 0 ? "Top run" : index < 3 ? "Podium" : "Climber",
        isYou: Boolean(currentUserId && row.userId === currentUserId),
        userId: row.userId,
      };
    });
}

export async function getPwnit2CampaignSnapshot(options: { includeActor?: boolean } = {}) {
  const actor = options.includeActor ? await getCurrentActor() : null;
  const item = await ensurePwnit2Item();
  const initialRound = await ensurePwnit2Round(item.id);
  const round = await syncPwnit2Round(item.id, initialRound);
  const leaderboard = await getLeaderboard(item.id, round.id, actor?.user?.id ?? null);
  const activationPoints = Math.min(ACTIVATION_PLAYS, Number(round.attemptCount ?? 0));
  const activationPct = Math.min(100, Math.round((activationPoints / Math.max(1, ACTIVATION_PLAYS)) * 100));
  const participants = leaderboard.length;
  const top = leaderboard[0] ?? null;

  const snapshot: Pwnit2CampaignSnapshot = {
    title: ITEM_TITLE,
    category: "Live campaign",
    statusLabel: statusLabelFromRound(round),
    statusTone: statusToneFromRound(round),
    baseValueLabel: `R${BASE_VALUE_ZAR}`,
    currentValueLabel: `R${BASE_VALUE_ZAR}`,
    activationPct,
    activationPoints,
    activationTargetPoints: ACTIVATION_PLAYS,
    participants,
    attempts: Number(round.attemptCount ?? 0),
    countdownLabel: countdownLabel(round),
    gameTitle: GAME_TITLE,
    gameHref: "/play/pwnit-2",
    leaderboardHref: "/pwnit-2/leaderboard",
    statusHref: "/pwnit-2/status",
    helper:
      round.state === "BUILDING"
        ? "Play Number Chain Sprint to help unlock the countdown."
        : round.state === "ACTIVATED"
          ? "The countdown is live. Keep playing to improve your leaderboard position."
          : round.state === "CLOSED"
            ? "The board is frozen and the final campaign status is open."
            : "This campaign is archived.",
    primaryMetricLabel: round.state === "BUILDING" ? "Activation" : "Status",
    primaryMetricValue: round.state === "BUILDING" ? `${activationPct}%` : statusLabelFromRound(round),
    secondaryMetricLabel: "Players",
    secondaryMetricValue: String(participants),
    tertiaryMetricLabel: "Top score",
    tertiaryMetricValue: top ? String(top.score) : "—",
    state: statusFromRound(round),
    closesAt: safeDateIso(round.closesAt),
    statusWindowEndsAt: safeDateIso(round.purchaseGraceEndsAt),
    winnerAlias: round.state === "CLOSED" || round.state === "ARCHIVED" ? top?.alias ?? null : null,
    topScore: top?.score ?? null,
  };

  return { item, round, snapshot, leaderboard, actor };
}

export async function submitPwnit2Score(input: { score: number; elapsedSeconds: number; correct: number; total: number }) {
  const actor = await getCurrentActor();
  const item = await ensurePwnit2Item();
  const initialRound = await ensurePwnit2Round(item.id);
  const round = await syncPwnit2Round(item.id, initialRound);

  if (!["BUILDING", "ACTIVATED"].includes(String(round.state))) {
    const current = await getPwnit2CampaignSnapshot({ includeActor: true });
    return { ok: false as const, status: 409, error: "This campaign is no longer accepting plays.", ...current };
  }

  const score = Math.max(0, Math.min(999999, Math.floor(Number(input.score || 0))));
  const elapsedSeconds = Math.max(0, Math.min(3600, Math.floor(Number(input.elapsedSeconds || 0))));
  const correct = Math.max(0, Math.min(20, Math.floor(Number(input.correct || 0))));
  const total = Math.max(1, Math.min(20, Math.floor(Number(input.total || 1))));

  await prisma.$transaction(async (tx) => {
    await tx.attempt.create({
      data: {
        userId: actor.user.id,
        itemId: item.id,
        roundId: round.id,
        dayKey: dayKeyZA(),
        costCredits: 0,
        freeUsed: 0,
        paidUsed: 0,
        isPaid: false,
        scoreMs: scoreToScoreMs(score),
        flags: JSON.stringify({ pwnit2: true, score, elapsedSeconds, correct, total }).slice(0, 2000),
      } as any,
    });
    await tx.itemRound.update({
      where: { id: round.id },
      data: { attemptCount: { increment: 1 } },
    });
  });

  const current = await getPwnit2CampaignSnapshot({ includeActor: true });
  const myRank = current.leaderboard.find((entry) => entry.isYou)?.rank ?? null;
  return { ok: true as const, myRank, ...current };
}
