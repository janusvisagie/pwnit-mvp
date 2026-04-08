import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TITLE_MAP = {
  "Fuel Voucher": "hidden-pair-memory",
  "Checkers Voucher": "clue-ladder",
  "Takealot Voucher": "progressive-mosaic",
  "Sony WH-1000XM5 Headphones": "codebreaker",
  "Nintendo Switch OLED": "spot-the-missing",
  "GoPro HERO13 Black": "rapid-math-relay",
};

const LEGACY_KEY_MAP = {
  "memory-sprint": "hidden-pair-memory",
  "number-memory": "hidden-pair-memory",
  "quick-stop": "pattern-match",
  "precision-timer": "pattern-match",
  "stop-zero": "pattern-match",
  "moving-zone": "rule-lock",
  "rhythm-hold": "rule-lock",
  "trace-run": "transform-memory",
  "alphabet-sprint": "transform-memory",
  "flash-count": "codebreaker",
  "tap-speed": "codebreaker",
  "tap-pattern": "codebreaker",
  "target-grid": "balance-grid",
  "target-hold": "balance-grid",
  "sequence-restore": "hidden-pair-memory",
  "route-builder": "rapid-math-relay",
  "transform-memory": "clue-ladder",
  "pattern-match": "progressive-mosaic",
  "rule-lock": "spot-the-missing",
  "signal-hunt": "spot-the-missing",
  "balance-grid": "rapid-math-relay",
  "safe-path-fog": "rapid-math-relay",
};

function pickVerifiedGameKey(item) {
  return TITLE_MAP[item.title] || LEGACY_KEY_MAP[item.gameKey] || item.gameKey;
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
    select: { id: true, title: true, gameKey: true },
    orderBy: { createdAt: "asc" },
  });

  let changed = 0;
  for (const item of items) {
    const nextGameKey = pickVerifiedGameKey(item);
    if (!nextGameKey || nextGameKey === item.gameKey) continue;
    await prisma.item.update({
      where: { id: item.id },
      data: { gameKey: nextGameKey },
    });
    changed += 1;
    console.log(`Updated ${item.title}: ${item.gameKey} -> ${nextGameKey}`);
  }

  return { items, changed };
}

async function main() {
  const { items, changed } = await relinkItems();
  await clearCompetitiveState();

  console.log("");
  console.log(`Items checked: ${items.length}`);
  console.log(`Items relinked: ${changed}`);
  console.log("Competitive attempts, sessions, rounds, and winners were cleared so old results do not mix with the current evaluation set.");
  console.log("This script no longer auto-refunds credits, so balances should not jump unexpectedly.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
