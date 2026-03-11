import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Postgres-safe cleanup for the current schema.
  // Delete child rows first, then items.
  await prisma.winner.deleteMany();
  await prisma.attempt.deleteMany();

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
      gameKey: "flash-count",
    },
    {
      title: "Checkers Voucher",
      prizeType: "Voucher",
      prizeValueZAR: 500,
      imageUrl: "/products/checkers-voucher.svg",
      activationGoalEntries: 3,
      countdownMinutes: 1,
      gameKey: "memory-sprint",
    },
    {
      title: "Takealot Voucher",
      prizeType: "Voucher",
      prizeValueZAR: 1000,
      imageUrl: "/products/takealot-voucher.svg",
      activationGoalEntries: 3,
      countdownMinutes: 1,
      gameKey: "target-grid",
    },
    {
      title: "Sony WH-1000XM5 Headphones",
      prizeType: "Physical",
      prizeValueZAR: 1999,
      imageUrl: "/products/sony-wh-1000xm5.png",
      activationGoalEntries: 3,
      countdownMinutes: 1,
      gameKey: "quick-stop",
    },
    {
      title: "Nintendo Switch OLED",
      prizeType: "Physical",
      prizeValueZAR: 3499,
      imageUrl: "/products/nintendo-switch-oled.png",
      activationGoalEntries: 3,
      countdownMinutes: 1,
      gameKey: "moving-zone",
    },
    {
      title: "GoPro HERO13 Black",
      prizeType: "Physical",
      prizeValueZAR: 6499,
      imageUrl: "/products/gopro-hero13-black.png",
      activationGoalEntries: 3,
      countdownMinutes: 1,
      gameKey: "trace-run",
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

  console.log("Seeded 6 items with 6 distinct games.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
