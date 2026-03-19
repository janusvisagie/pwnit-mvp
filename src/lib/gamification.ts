import { prisma } from "@/lib/db";

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function daysBetween(left: Date, right: Date) {
  return Math.round((startOfDay(left).getTime() - startOfDay(right).getTime()) / 86400000);
}

function currency(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(value);
}

function inferGameFamily(title?: string | null, gameKey?: string | null) {
  const hay = `${title || ""} ${gameKey || ""}`.toLowerCase();

  if (/(flash|count|speed|rapid|quick)/.test(hay)) return "speed";
  if (/(target|grid|precision|aim|tap)/.test(hay)) return "precision";
  if (/(memory|match|sequence|recall)/.test(hay)) return "memory";

  return "general";
}

function formatPlayDate(dayKey?: string | null) {
  if (!dayKey) return null;

  const date = new Date(`${dayKey}T00:00:00+02:00`);
  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export type DashboardProfile = {
  displayName: string;
  email: string;
  referralCode: string | null;
  referralLink: string | null;
  stats: {
    gamesPlayed: number;
    bestRank: number | null;
    bestRankLabel: string;
    totalWinningsValue: number;
    totalWinningsLabel: string;
    streakDays: number;
    qualifiedReferrals: number;
    feedbackRewards: number;
  };
  achievements: Array<{
    key: string;
    title: string;
    description: string;
    unlocked: boolean;
    progressLabel?: string;
  }>;
  badges: string[];
  share: {
    headline: string;
    body: string;
  };
};

export async function getDashboardProfile(userId: string): Promise<DashboardProfile | null> {
  const [user, attempts, winners, qualifiedReferrals, feedbackCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        alias: true,
        referralCode: true,
      },
    }),
    prisma.attempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        dayKey: true,
        item: {
          select: {
            title: true,
            gameKey: true,
            prizeValueZAR: true,
          },
        },
      },
    }),
    prisma.winner.findMany({
      where: { userId },
      orderBy: [{ rank: "asc" }, { createdAt: "desc" }],
      select: {
        rank: true,
        dayKey: true,
        item: {
          select: {
            title: true,
            gameKey: true,
            prizeValueZAR: true,
          },
        },
      },
    }),
    prisma.referral.count({
      where: {
        referrerUserId: userId,
        status: "QUALIFIED",
      },
    }),
    prisma.surveyResponse.count({
      where: {
        userId,
        rewardCredits: { gt: 0 },
      },
    }),
  ]);

  if (!user) return null;

  const uniqueDays = Array.from(new Set(attempts.map((attempt) => attempt.dayKey))).sort().reverse();
  let streakDays = 0;

  if (uniqueDays.length) {
    let previous = new Date(`${uniqueDays[0]}T00:00:00+02:00`);
    streakDays = 1;

    for (let index = 1; index < uniqueDays.length; index += 1) {
      const current = new Date(`${uniqueDays[index]}T00:00:00+02:00`);
      const gap = daysBetween(previous, current);
      if (gap === 1) {
        streakDays += 1;
        previous = current;
      } else {
        break;
      }
    }
  }

  const bestWinner = winners.slice().sort((left, right) => {
    if (left.rank !== right.rank) return left.rank - right.rank;
    return (right.item?.prizeValueZAR || 0) - (left.item?.prizeValueZAR || 0);
  })[0];

  const rankOneWins = winners.filter((winner) => winner.rank === 1);
  const totalWinningsValue = rankOneWins.reduce((sum, winner) => sum + Number(winner.item?.prizeValueZAR || 0), 0);

  const speedResults = winners.filter((winner) => inferGameFamily(winner.item?.title, winner.item?.gameKey) === "speed");
  const precisionAttempts = attempts.filter((attempt) => inferGameFamily(attempt.item?.title, attempt.item?.gameKey) === "precision");
  const memoryAttempts = attempts.filter((attempt) => inferGameFamily(attempt.item?.title, attempt.item?.gameKey) === "memory");
  const biggestPrize = rankOneWins.reduce((max, winner) => Math.max(max, Number(winner.item?.prizeValueZAR || 0)), 0);

  const badges = [
    speedResults.length ? "⚡ Speed Specialist" : null,
    precisionAttempts.length >= 3 ? "🎯 Precision Pro" : null,
    memoryAttempts.length >= 3 ? "🧠 Memory Master" : null,
  ].filter(Boolean) as string[];

  const bestRankLabel = bestWinner
    ? `#${bestWinner.rank} (${bestWinner.item?.title || "Prize round"}, ${formatPlayDate(bestWinner.dayKey) || "recently"})`
    : "No leaderboard finish yet";

  const referralBase = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "";
  const referralLink = user.referralCode && referralBase ? `${referralBase.replace(/\/$/, "")}/?ref=${encodeURIComponent(user.referralCode)}` : null;

  const shareHeadline = bestWinner
    ? `I hit ${bestRankLabel} on PwnIt 🎉`
    : `I’m playing skill-based prize challenges on PwnIt 🎯`;

  const shareBody = [
    shareHeadline,
    totalWinningsValue > 0 ? `Total prize value won so far: ${currency(totalWinningsValue)}.` : null,
    referralLink ? `Try it here: ${referralLink}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    displayName: user.alias || user.email,
    email: user.email,
    referralCode: user.referralCode ?? null,
    referralLink,
    stats: {
      gamesPlayed: attempts.length,
      bestRank: bestWinner?.rank ?? null,
      bestRankLabel,
      totalWinningsValue,
      totalWinningsLabel: currency(totalWinningsValue),
      streakDays,
      qualifiedReferrals,
      feedbackRewards: feedbackCount,
    },
    achievements: [
      {
        key: "first-win",
        title: "First Win",
        description: "Won any prize round.",
        unlocked: rankOneWins.length > 0,
      },
      {
        key: "speed-demon",
        title: "Speed Demon",
        description: "Top finish in a speed-based game.",
        unlocked: speedResults.some((winner) => winner.rank <= 10),
        progressLabel: speedResults.length ? `${speedResults.length} qualifying speed finishes` : "Play a speed game and post a fast score",
      },
      {
        key: "consistent",
        title: "Consistent",
        description: "Played 7 days in a row.",
        unlocked: streakDays >= 7,
        progressLabel: `${Math.min(streakDays, 7)}/7 days`,
      },
      {
        key: "big-winner",
        title: "Big Winner",
        description: "Win a prize worth R1,000 or more.",
        unlocked: biggestPrize >= 1000,
        progressLabel: biggestPrize > 0 ? `Best win so far: ${currency(biggestPrize)}` : "Still in progress",
      },
    ],
    badges,
    share: {
      headline: shareHeadline,
      body: shareBody,
    },
  };
}
