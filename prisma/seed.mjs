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
      title: "Takealot Voucher",
      prizeType: "Voucher",
      prizeValueZAR: 500,
      imageUrl: "/products/pwnit_takealot-voucher.png",
      activationGoalEntries: 5,
      countdownMinutes: 2,
      activationCoverageRatio: 1.0,
    },
    {
      title: "Checkers Voucher",
      prizeType: "Voucher",
      prizeValueZAR: 750,
      imageUrl: "/products/pwnit_checkers-voucher.png",
      activationGoalEntries: 5,
      countdownMinutes: 2,
      activationCoverageRatio: 0.95,
    },
    {
      title: "Fuel Voucher",
      prizeType: "Voucher",
      prizeValueZAR: 1000,
      imageUrl: "/products/petrol-voucher.svg",
      activationGoalEntries: 6,
      countdownMinutes: 3,
      activationCoverageRatio: 0.9,
    },
    {
      title: "Woolworths Voucher",
      prizeType: "Voucher",
      prizeValueZAR: 1200,
      imageUrl: "/products/woolworths-voucher.svg",
      activationGoalEntries: 6,
      countdownMinutes: 3,
      activationCoverageRatio: 0.9,
    },
    {
      title: "Air Fryer",
      prizeType: "Physical",
      prizeValueZAR: 2500,
      imageUrl: "/products/pwnit_air-fryer.png",
      activationGoalEntries: 7,
      countdownMinutes: 4,
      activationCoverageRatio: 0.85,
    },
    {
      title: "Smeg Kettle",
      prizeType: "Physical",
      prizeValueZAR: 3000,
      imageUrl: "/products/pwnit_smeg-kettle.png",
      activationGoalEntries: 8,
      countdownMinutes: 5,
      activationCoverageRatio: 0.8,
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
        shortDesc: null,
        productUrl: null,
        state: "OPEN",
        activationGoalEntries: it.activationGoalEntries,
        countdownMinutes: it.countdownMinutes,
        opensAt: now,
        subscriberOnly: false,
        activationCoverageRatio: it.activationCoverageRatio,
        gameKey: pickFromPool(idx),
      },
    });
  }

  console.log("Seeded 6 marketplace items with per-item coverage ratios.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
