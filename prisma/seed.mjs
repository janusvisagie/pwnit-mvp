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
      title: "55\" Smart TV",
      prizeType: "Physical",
      prizeValueZAR: 6999,
      imageUrl: "/products/tv.svg",
      activationGoalEntries: 3,
      countdownMinutes: 1,
      shortDesc: "Big-screen headline prize.",
    },
    {
      title: "AR Glasses",
      prizeType: "Physical",
      prizeValueZAR: 3499,
      imageUrl: "/products/ar-glasses.svg",
      activationGoalEntries: 3,
      countdownMinutes: 1,
      shortDesc: "A cooler tech prize for the mid-tier slot.",
    },
    {
      title: "Wireless Headphones",
      prizeType: "Physical",
      prizeValueZAR: 2199,
      imageUrl: "/products/headphones.svg",
      activationGoalEntries: 3,
      countdownMinutes: 1,
      shortDesc: "Popular, giftable, and easy to value.",
    },
    {
      title: "Takealot Voucher",
      prizeType: "Voucher",
      prizeValueZAR: 1500,
      imageUrl: "/products/takealot-voucher.svg",
      activationGoalEntries: 3,
      countdownMinutes: 1,
      shortDesc: "Instant digital voucher.",
    },
    {
      title: "Checkers Voucher",
      prizeType: "Voucher",
      prizeValueZAR: 1000,
      imageUrl: "/products/checkers-voucher.svg",
      activationGoalEntries: 3,
      countdownMinutes: 1,
      shortDesc: "Useful everyday grocery value.",
    },
    {
      title: "Petrol Voucher",
      prizeType: "Voucher",
      prizeValueZAR: 750,
      imageUrl: "/products/petrol-voucher.svg",
      activationGoalEntries: 3,
      countdownMinutes: 1,
      shortDesc: "Fast-moving, easy-win feel item.",
    },
  ];

  for (let idx = 0; idx < items.length; idx++) {
    const it = items[idx];
    await prisma.item.create({
      data: {
        title: it.title,
        tier: 1,
        prizeType: it.prizeType,
        prizeValueZAR: it.prizeValueZAR,
        imageUrl: it.imageUrl,
        shortDesc: it.shortDesc,
        productUrl: null,
        state: "OPEN",
        activationGoalEntries: it.activationGoalEntries,
        countdownMinutes: it.countdownMinutes,
        opensAt: now,
        subscriberOnly: false,
        gameKey: pickFromPool(idx),
      },
    });
  }

  console.log("Seeded 6 items with a stronger conversion mix.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
