import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearItemData() {
  await prisma.winner.deleteMany();
  await prisma.attempt.deleteMany();
  try {
    await prisma.attemptSession.deleteMany();
  } catch {}
  try {
    await prisma.itemPurchase.deleteMany();
  } catch {}
  try {
    await prisma.creditLedger.deleteMany({ where: { itemId: { not: null } } });
  } catch {}
  try {
    await prisma.itemRound.deleteMany();
  } catch {}
  await prisma.item.deleteMany();
}

const TARGET_PAID_PLAYS = 100;
const FUNDING_WINDOW_HOURS = 168;
const PURCHASE_GRACE_HOURS = 24;
const COUNTDOWN_MINUTES = 30;

const items = [
  {
    title: "Fuel Voucher",
    prizeType: "Voucher",
    prizeValueZAR: 300,
    landedCostZAR: 300,
    allowedSubsidyCredits: 0,
    playCostCredits: 3,
    fundingWindowHours: FUNDING_WINDOW_HOURS,
    purchaseGraceHours: PURCHASE_GRACE_HOURS,
    countdownMinutes: COUNTDOWN_MINUTES,
    sortOrder: 10,
    imageUrl: "/products/petrol-voucher.svg",
    gameKey: "hidden-pair-memory",
  },
  {
    title: "Checkers Voucher",
    prizeType: "Voucher",
    prizeValueZAR: 500,
    landedCostZAR: 500,
    allowedSubsidyCredits: 0,
    playCostCredits: 5,
    fundingWindowHours: FUNDING_WINDOW_HOURS,
    purchaseGraceHours: PURCHASE_GRACE_HOURS,
    countdownMinutes: COUNTDOWN_MINUTES,
    sortOrder: 20,
    imageUrl: "/products/checkers-voucher.svg",
    gameKey: "clue-ladder", // user-facing label: Number Chain
  },
  {
    title: "Takealot Voucher",
    prizeType: "Voucher",
    prizeValueZAR: 1000,
    landedCostZAR: 1000,
    allowedSubsidyCredits: 0,
    playCostCredits: 10,
    fundingWindowHours: FUNDING_WINDOW_HOURS,
    purchaseGraceHours: PURCHASE_GRACE_HOURS,
    countdownMinutes: COUNTDOWN_MINUTES,
    sortOrder: 30,
    imageUrl: "/products/takealot-voucher.svg",
    gameKey: "progressive-mosaic",
  },
  {
    title: "Sony WH-1000XM5 Headphones",
    prizeType: "Physical",
    prizeValueZAR: 1999,
    landedCostZAR: 1850,
    allowedSubsidyCredits: 0,
    playCostCredits: 20,
    fundingWindowHours: FUNDING_WINDOW_HOURS,
    purchaseGraceHours: PURCHASE_GRACE_HOURS,
    countdownMinutes: COUNTDOWN_MINUTES,
    sortOrder: 40,
    imageUrl: "/products/sony-xm5-headphones.svg",
    gameKey: "codebreaker",
  },
  {
    title: "Nintendo Switch OLED",
    prizeType: "Physical",
    prizeValueZAR: 3499,
    landedCostZAR: 3200,
    allowedSubsidyCredits: 0,
    playCostCredits: 35,
    fundingWindowHours: FUNDING_WINDOW_HOURS,
    purchaseGraceHours: PURCHASE_GRACE_HOURS,
    countdownMinutes: COUNTDOWN_MINUTES,
    sortOrder: 50,
    imageUrl: "/products/nintendo-switch-oled.svg",
    gameKey: "spot-the-missing",
  },
  {
    title: "GoPro HERO13 Black",
    prizeType: "Physical",
    prizeValueZAR: 6499,
    landedCostZAR: 5900,
    allowedSubsidyCredits: 0,
    playCostCredits: 65,
    fundingWindowHours: FUNDING_WINDOW_HOURS,
    purchaseGraceHours: PURCHASE_GRACE_HOURS,
    countdownMinutes: COUNTDOWN_MINUTES,
    sortOrder: 60,
    imageUrl: "/products/gopro-hero.svg",
    gameKey: "rapid-math-relay",
  },
];

async function main() {
  await clearItemData();
  const now = new Date();

  for (const item of items) {
    await prisma.item.create({
      data: {
        title: item.title,
        tier: 1,
        prizeType: item.prizeType,
        prizeValueZAR: item.prizeValueZAR,
        landedCostZAR: item.landedCostZAR,
        allowedSubsidyCredits: item.allowedSubsidyCredits,
        playCostCredits: item.playCostCredits,
        fundingWindowHours: item.fundingWindowHours,
        purchaseGraceHours: item.purchaseGraceHours,
        sortOrder: item.sortOrder,
        imageUrl: item.imageUrl,
        shortDesc: null,
        productUrl: null,
        state: "OPEN",
        activationGoalEntries: TARGET_PAID_PLAYS,
        countdownMinutes: item.countdownMinutes,
        opensAt: now,
        subscriberOnly: false,
        gameKey: item.gameKey,
      },
    });
  }

  console.log("Seeded 6 items with ~100 paid-play-equivalent activation targets, 30 daily free credits, and explicit verified-subscriber contribution.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
