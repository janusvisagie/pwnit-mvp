// prisma/seed.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ Add more keys as you add more games
const GAME_POOL = [
  "precision-timer",
  "rhythm-hold",
  "tap-speed",
  "number-memory",
  "target-hold",
  "stop-zero",
  "tap-pattern",
];

// Stable-ish pick so seeds don’t shuffle randomly each run
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
      title: "Smeg Kettle",
      prizeType: "Physical",
      prizeValueZAR: 3000,
      imageUrl: "/products/pwnit_smeg-kettle.png",
      activationGoalEntries: 5,
      countdownMinutes: 1,
    },
    {
      title: "Checkers Voucher",
      prizeType: "Voucher",
      prizeValueZAR: 1000,
      imageUrl: "/products/pwnit_checkers-voucher.png",
      activationGoalEntries: 5,
      countdownMinutes: 1,
    },
    {
      title: "Air Fryer",
      prizeType: "Physical",
      prizeValueZAR: 2500,
      imageUrl: "/products/pwnit_air-fryer.png",
      activationGoalEntries: 5,
      countdownMinutes: 1,
    },
    {
      title: "Takealot Voucher",
      prizeType: "Voucher",
      prizeValueZAR: 1500,
      imageUrl: "/products/pwnit_takealot-voucher.png",
      activationGoalEntries: 5,
      countdownMinutes: 1,
    },
  ];

  for (let idx = 0; idx < items.length; idx++) {
    const it = items[idx];
    const gameKey = pickFromPool(idx);

    await prisma.item.create({
      data: {
        title: it.title,
        tier: 1, // harmless even if you later stop using it
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

        // ✅ sticky game assignment
        gameKey,
      },
    });
  }

  console.log("Seeded 4 items + sticky gameKey.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
