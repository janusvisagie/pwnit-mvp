// prisma/seed.js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // Wipe items + related rows for a clean MVP reset (safe for local/dev)
  await prisma.winner.deleteMany({});
  await prisma.attempt.deleteMany({});
  await prisma.item.deleteMany({});

  const now = new Date();
  const opensAt = new Date(now.getTime() - 60_000); // already open

  // ✅ Make sure these paths match your public folder
  // Put images in: /public/items/
  // Example: /public/items/pwnit_smeg-kettle.png
  const items = [
    {
      title: "Smeg Kettle",
      tier: 3,
      prizeType: "physical",
      prizeValueZAR: 3000,
      imageUrl: "/items/pwnit_smeg-kettle.png",
      shortDesc: "Premium retro-style kettle.",
      productUrl: null,
      state: "OPEN",
      activationGoalEntries: 5,
      countdownMinutes: 60,
      opensAt,
      closesAt: null,
      publishedAt: null,
      subscriberOnly: false,
      gameKey: "precision-timer",
    },
    {
      title: "Checkers Voucher",
      tier: 1,
      prizeType: "voucher",
      prizeValueZAR: 1000,
      imageUrl: "/items/pwnit_checkers-voucher.png",
      shortDesc: "R1,000 Checkers gift card.",
      productUrl: null,
      state: "OPEN",
      activationGoalEntries: 5,
      countdownMinutes: 60,
      opensAt,
      closesAt: null,
      publishedAt: null,
      subscriberOnly: false,
      gameKey: "rhythm-hold",
    },
    {
      title: "Air Fryer",
      tier: 2,
      prizeType: "physical",
      prizeValueZAR: 2500,
      imageUrl: "/items/pwnit_air-fryer.png",
      shortDesc: "Crispy results with less oil.",
      productUrl: null,
      state: "OPEN",
      activationGoalEntries: 5,
      countdownMinutes: 60,
      opensAt,
      closesAt: null,
      publishedAt: null,
      subscriberOnly: false,
      gameKey: "tap-speed",
    },
    {
      title: "Takealot Voucher",
      tier: 2,
      prizeType: "voucher",
      prizeValueZAR: 1500,
      imageUrl: "/items/pwnit_takealot-voucher.png",
      shortDesc: "R1,500 Takealot gift card.",
      productUrl: null,
      state: "OPEN",
      activationGoalEntries: 5,
      countdownMinutes: 60,
      opensAt,
      closesAt: null,
      publishedAt: null,
      subscriberOnly: false,
      gameKey: "number-memory",
    },
  ];

  // Create
  await prisma.item.createMany({ data: items });

  console.log(`✅ Seeded ${items.length} items.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });