
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.winner.deleteMany();
  await prisma.attempt.deleteMany();

  try {
    await prisma.attemptSession.deleteMany();
  } catch {}

  try {
    await prisma.itemPurchase.deleteMany();
  } catch {}

  await prisma.item.deleteMany();

  const now = new Date();

  const items = [
    {
      title: "Fuel Voucher",
      prizeType: "Voucher",
      prizeValueZAR: 300,
      imageUrl: "/products/petrol-voucher.svg",
      activationGoalEntries: 3,
      countdownMinutes: 1,
      gameKey: "hidden-pair-memory",
    },
    {
      title: "Checkers Voucher",
      prizeType: "Voucher",
      prizeValueZAR: 500,
      imageUrl: "/products/checkers-voucher.svg",
      activationGoalEntries: 3,
      countdownMinutes: 1,
      gameKey: "clue-ladder",
    },
    {
      title: "Takealot Voucher",
      prizeType: "Voucher",
      prizeValueZAR: 1000,
      imageUrl: "/products/takealot-voucher.svg",
      activationGoalEntries: 3,
      countdownMinutes: 1,
      gameKey: "progressive-mosaic",
    },
    {
      title: "Sony WH-1000XM5 Headphones",
      prizeType: "Physical",
      prizeValueZAR: 1999,
      imageUrl: "/products/sony-xm5-headphones.svg",
      activationGoalEntries: 3,
      countdownMinutes: 1,
      gameKey: "codebreaker",
    },
    {
      title: "Nintendo Switch OLED",
      prizeType: "Physical",
      prizeValueZAR: 3499,
      imageUrl: "/products/nintendo-switch-oled.svg",
      activationGoalEntries: 3,
      countdownMinutes: 1,
      gameKey: "spot-the-missing",
    },
    {
      title: "GoPro HERO13 Black",
      prizeType: "Physical",
      prizeValueZAR: 6499,
      imageUrl: "/products/gopro-hero.svg",
      activationGoalEntries: 3,
      countdownMinutes: 1,
      gameKey: "rapid-math-relay",
    },
  ];

  for (const it of items) {
    await prisma.item.create({
      data: {
        title: it.title,
        tier: 1,
        prizeType: it.prizeType,
        prizeValueZAR: it.prizeValueZAR,
        imageUrl: it.imageUrl,
        shortDesc: null,
        productUrl: null,
        state: "OPEN",
        activationGoalEntries: it.activationGoalEntries,
        countdownMinutes: it.countdownMinutes,
        opensAt: now,
        subscriberOnly: false,
        gameKey: it.gameKey,
      },
    });
  }

  console.log("Seeded 6 items with Hidden Pair Memory, Codebreaker, Progressive Mosaic, Clue Ladder, Spot the Missing, and Rapid Math Relay.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
