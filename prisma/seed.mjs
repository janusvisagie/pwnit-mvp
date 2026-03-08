import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

async function main() {
  await prisma.creditLedger.deleteMany();
  await prisma.winner.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.itemPurchase.deleteMany();
  await prisma.itemRound.deleteMany();
  await prisma.item.deleteMany();

  const now = new Date();

  const items = [
    {
      title: "Fuel Voucher",
      prizeType: "Voucher",
      prizeValueZAR: 300,
      landedCostZAR: 300,
      allowedSubsidyCredits: 30,
      imageUrl: "/products/petrol-voucher.svg",
      playCostCredits: 5,
      fundingWindowHours: 48,
      purchaseGraceHours: 24,
      countdownMinutes: 1,
      sortOrder: 1,
      tier: 1,
      isHero: false,
      gameKey: "tap-speed",
      shortDesc: "A practical transport voucher that feels instantly useful.",
    },
    {
      title: "Checkers Voucher",
      prizeType: "Voucher",
      prizeValueZAR: 500,
      landedCostZAR: 500,
      allowedSubsidyCredits: 50,
      imageUrl: "/products/checkers-voucher.svg",
      playCostCredits: 5,
      fundingWindowHours: 48,
      purchaseGraceHours: 24,
      countdownMinutes: 1,
      sortOrder: 2,
      tier: 1,
      isHero: false,
      gameKey: "number-memory",
      shortDesc: "A grocery voucher with broad household appeal.",
    },
    {
      title: "Takealot Voucher",
      prizeType: "Voucher",
      prizeValueZAR: 1000,
      landedCostZAR: 1000,
      allowedSubsidyCredits: 100,
      imageUrl: "/products/takealot-voucher.svg",
      playCostCredits: 5,
      fundingWindowHours: 48,
      purchaseGraceHours: 24,
      countdownMinutes: 1,
      sortOrder: 3,
      tier: 1,
      isHero: false,
      gameKey: "target-hold",
      shortDesc: "A flexible online-shopping voucher for everyday wins.",
    },
    {
      title: "Sony WH-1000XM5 Headphones",
      prizeType: "Physical",
      prizeValueZAR: 1999,
      landedCostZAR: 1999,
      allowedSubsidyCredits: 300,
      imageUrl: "/products/sony-xm5-headphones.svg",
      playCostCredits: 10,
      fundingWindowHours: 48,
      purchaseGraceHours: 24,
      countdownMinutes: 1,
      sortOrder: 4,
      tier: 2,
      isHero: false,
      gameKey: "tap-speed",
      shortDesc: "Premium wireless headphones with strong everyday desirability.",
    },
    {
      title: "Nintendo Switch OLED",
      prizeType: "Physical",
      prizeValueZAR: 3499,
      landedCostZAR: 3499,
      allowedSubsidyCredits: 525,
      imageUrl: "/products/nintendo-switch-oled.svg",
      playCostCredits: 15,
      fundingWindowHours: 48,
      purchaseGraceHours: 24,
      countdownMinutes: 1,
      sortOrder: 5,
      tier: 2,
      isHero: false,
      gameKey: "number-memory",
      shortDesc: "A versatile console that works well as an aspirational mid-tier prize.",
    },
    {
      title: "GoPro HERO13 Black",
      prizeType: "Physical",
      prizeValueZAR: 6499,
      landedCostZAR: 6499,
      allowedSubsidyCredits: 1625,
      imageUrl: "/products/gopro-hero.svg",
      playCostCredits: 20,
      fundingWindowHours: 72,
      purchaseGraceHours: 24,
      countdownMinutes: 1,
      sortOrder: 6,
      tier: 3,
      isHero: true,
      gameKey: "target-hold",
      shortDesc: "A hero prize designed to draw attention and repeat attempts.",
    },
  ];

  for (let idx = 0; idx < items.length; idx++) {
    const it = items[idx];

    const item = await prisma.item.create({
      data: {
        ...it,
        state: "OPEN",
        activationGoalEntries: 3,
        opensAt: now,
      },
    });

    await prisma.itemRound.create({
      data: {
        itemId: item.id,
        sequence: 1,
        state: "BUILDING",
        fundingStartsAt: now,
        fundingEndsAt: addHours(now, it.fundingWindowHours),
        activationTargetCredits: it.landedCostZAR - it.allowedSubsidyCredits,
        purchaseGraceEndsAt: addHours(now, it.purchaseGraceHours),
      },
    });
  }

  console.log("Seeded 6 items + v2 funding rounds.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
