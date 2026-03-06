import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GAME_POOL = [
  "precision-timer",
  "rhythm-hold",
  "tap-speed",
  "number-memory",
  "target-hold",
  "stop-zero",
  "tap-pattern",
];

function pickFromPool(i) {
  return GAME_POOL[i % GAME_POOL.length];
}

async function main() {
  await prisma.winner.deleteMany();
  await prisma.attempt.deleteMany();
  try {
    await prisma.itemPurchase.deleteMany();
  } catch {}
  await prisma.item.deleteMany();

  const now = new Date();

  const items = [
    {
      title: "Nintendo Switch OLED",
      prizeType: "Physical",
      prizeValueZAR: 8500,
      imageUrl: "/products/nintendo-switch-oled.svg",
      activationGoalEntries: 3,
      countdownMinutes: 1,
    },
    {
      title: "Sony WH-1000XM5 Headphones",
      prizeType: "Physical",
      prizeValueZAR: 7999,
      imageUrl: "/products/sony-xm5-headphones.svg",
      activationGoalEntries: 3,
      countdownMinutes: 1,
    },
    {
      title: "GoPro HERO13 Black",
      prizeType: "Physical",
      prizeValueZAR: 9999,
      imageUrl: "/products/gopro-hero.svg",
      activationGoalEntries: 3,
      countdownMinutes: 1,
    },
    {
      title: "Takealot Voucher",
      prizeType: "Voucher",
      prizeValueZAR: 1500,
      imageUrl: "/products/takealot-voucher.svg",
      activationGoalEntries: 3,
      countdownMinutes: 1,
    },
    {
      title: "Checkers Voucher",
      prizeType: "Voucher",
      prizeValueZAR: 1000,
      imageUrl: "/products/checkers-voucher.svg",
      activationGoalEntries: 3,
      countdownMinutes: 1,
    },
    {
      title: "Petrol Voucher",
      prizeType: "Voucher",
      prizeValueZAR: 1200,
      imageUrl: "/products/petrol-voucher.svg",
      activationGoalEntries: 3,
      countdownMinutes: 1,
    },
  ];

  for (let idx = 0; idx < items.length; idx++) {
    const it = items[idx];
    const gameKey = pickFromPool(idx);

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
        gameKey,
      },
    });
  }

  console.log("Seeded 6 items + sticky gameKey.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
