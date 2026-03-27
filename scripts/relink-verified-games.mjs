import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TITLE_MAP = {
  "Fuel Voucher": "sequence-restore",
  "Checkers Voucher": "transform-memory",
  "Takealot Voucher": "route-builder",
  "Sony WH-1000XM5 Headphones": "codebreaker",
  "Nintendo Switch OLED": "rule-lock",
  "GoPro HERO13 Black": "balance-grid",
};

const LEGACY_KEY_MAP = {
  "memory-sprint": "transform-memory",
  "number-memory": "transform-memory",
  "quick-stop": "route-builder",
  "precision-timer": "route-builder",
  "stop-zero": "route-builder",
  "moving-zone": "rule-lock",
  "rhythm-hold": "rule-lock",
  "trace-run": "sequence-restore",
  "alphabet-sprint": "sequence-restore",
  "flash-count": "codebreaker",
  "tap-speed": "codebreaker",
  "tap-pattern": "codebreaker",
  "target-grid": "balance-grid",
  "target-hold": "balance-grid",
};

function pickVerifiedGameKey(item) {
  return TITLE_MAP[item.title] || LEGACY_KEY_MAP[item.gameKey] || item.gameKey;
}

async function refundConsumedPlayCredits() {
  const attempts = await prisma.attempt.findMany({
    select: {
      userId: true,
      freeUsed: true,
      paidUsed: true,
    },
  });

  const refunds = new Map();

  for (const attempt of attempts) {
    const current = refunds.get(attempt.userId) || { free: 0, paid: 0 };
    current.free += Number(attempt.freeUsed || 0);
    current.paid += Number(attempt.paidUsed || 0);
    refunds.set(attempt.userId, current);
  }

  for (const [userId, refund] of refunds.entries()) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        freeCreditsBalance: { increment: refund.free },
        paidCreditsBalance: { increment: refund.paid },
      },
    });
  }

  return refunds;
}

async function clearCompetitiveState() {
  try {
    await prisma.winner.deleteMany();
  } catch {}

  try {
    await prisma.attemptSession.deleteMany();
  } catch {}

  try {
    await prisma.attempt.deleteMany();
  } catch {}

  try {
    await prisma.itemRound.deleteMany();
  } catch {}
}

async function relinkItems() {
  const items = await prisma.item.findMany({
    select: {
      id: true,
      title: true,
      gameKey: true,
    },
    orderBy: { createdAt: "asc" },
  });

  let changed = 0;

  for (const item of items) {
    const nextGameKey = pickVerifiedGameKey(item);
    if (!nextGameKey || nextGameKey === item.gameKey) continue;

    await prisma.item.update({
      where: { id: item.id },
      data: {
        gameKey: nextGameKey,
      },
    });

    changed += 1;
    console.log(`Updated ${item.title}: ${item.gameKey} -> ${nextGameKey}`);
  }

  return { items, changed };
}

async function main() {
  const { items, changed } = await relinkItems();
  const refunds = await refundConsumedPlayCredits();
  await clearCompetitiveState();

  const refundedUsers = refunds.size;
  const refundedFree = [...refunds.values()].reduce((sum, row) => sum + row.free, 0);
  const refundedPaid = [...refunds.values()].reduce((sum, row) => sum + row.paid, 0);

  console.log("");
  console.log(`Items checked: ${items.length}`);
  console.log(`Items relinked: ${changed}`);
  console.log(`Users refunded: ${refundedUsers}`);
  console.log(`Free credits refunded: ${refundedFree}`);
  console.log(`Paid credits refunded: ${refundedPaid}`);
  console.log("Competitive attempts, sessions, rounds, and winners were cleared so legacy and verified results do not mix.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
