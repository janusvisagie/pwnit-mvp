// prisma/seed.demo.mjs
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

// Reuse your existing images (safe even if you don't have 30 distinct assets yet)
const IMAGE_POOL = [
  "/products/pwnit_smeg-kettle.png",
  "/products/pwnit_checkers-voucher.png",
  "/products/pwnit_air-fryer.png",
  "/products/pwnit_takealot-voucher.png",
];

function pickImage(i) {
  return IMAGE_POOL[i % IMAGE_POOL.length];
}

// Realistic-ish SA price tiers (ZAR)
const TIERS = [
  { min: 99, max: 299 },
  { min: 300, max: 799 },
  { min: 800, max: 1499 },
  { min: 1500, max: 2999 },
  { min: 3000, max: 4999 },
  { min: 5000, max: 9999 },
];

function tierForIndex(i) {
  // skew more items into low/mid tiers (OneDayOnly vibe)
  if (i < 10) return 0;
  if (i < 20) return 1;
  if (i < 26) return 2;
  if (i < 29) return 3;
  return 4;
}

function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function priceForTier(tierIdx) {
  const t = TIERS[tierIdx] ?? TIERS[1];
  // round to nice SA endings
  const raw = randInt(t.min, t.max);
  const nice = raw < 500 ? Math.round(raw / 10) * 10 : Math.round(raw / 50) * 50;
  return Math.max(t.min, Math.min(t.max, nice));
}

// Activation goals scale gently with value (still fast enough to demo)
function activationGoalForValue(v) {
  if (v <= 300) return 8;
  if (v <= 800) return 10;
  if (v <= 1500) return 12;
  if (v <= 3000) return 14;
  if (v <= 5000) return 16;
  return 18;
}

function minutesForValue(v) {
  if (v <= 300) return 2;
  if (v <= 800) return 3;
  if (v <= 1500) return 4;
  if (v <= 3000) return 5;
  if (v <= 5000) return 6;
  return 7;
}

const CATALOG = [
  { title: "Takealot Voucher", prizeType: "Voucher" },
  { title: "Checkers Voucher", prizeType: "Voucher" },
  { title: "Woolworths Voucher", prizeType: "Voucher" },
  { title: "Mr D Food Voucher", prizeType: "Voucher" },
  { title: "Uber Voucher", prizeType: "Voucher" },
  { title: "Dis-Chem Voucher", prizeType: "Voucher" },
  { title: "Clicks Voucher", prizeType: "Voucher" },
  { title: "Fuel Voucher", prizeType: "Voucher" },
  { title: "Bluetooth Speaker", prizeType: "Physical" },
  { title: "Air Fryer", prizeType: "Physical" },
  { title: "Smart Kettle", prizeType: "Physical" },
  { title: "Wireless Earbuds", prizeType: "Physical" },
  { title: "Gaming Mouse", prizeType: "Physical" },
  { title: "Mechanical Keyboard", prizeType: "Physical" },
  { title: "Power Bank", prizeType: "Physical" },
  { title: "Coffee Grinder", prizeType: "Physical" },
  { title: "Smartwatch", prizeType: "Physical" },
  { title: "Fitness Band", prizeType: "Physical" },
  { title: "LED Strip Lights", prizeType: "Physical" },
  { title: "Portable Blender", prizeType: "Physical" },
];

async function main() {
  // Clean slate for items + gameplay (keep users)
  await prisma.winner.deleteMany();
  await prisma.attempt.deleteMany();
  try {
    await prisma.itemPurchase.deleteMany();
  } catch {}
  await prisma.item.deleteMany();

  const now = new Date();

  const itemsToCreate = Array.from({ length: 30 }).map((_, i) => {
    const base = CATALOG[i % CATALOG.length];
    const tierIdx = tierForIndex(i);
    const value = priceForTier(tierIdx);

    // label vouchers nicely
    const title =
      base.prizeType === "Voucher" ? `${base.title} (R${value})` : base.title;

    const activationGoalEntries = activationGoalForValue(value);
    const countdownMinutes = minutesForValue(value);

    return {
      title,
      tier: tierIdx + 1,
      prizeType: base.prizeType,
      prizeValueZAR: value,
      imageUrl: pickImage(i),
      shortDesc: base.prizeType === "Voucher" ? "Instant digital voucher." : "Limited deal item.",
      productUrl: null,

      state: "OPEN",
      activationGoalEntries,
      countdownMinutes,
      opensAt: now,
      subscriberOnly: false,

      gameKey: pickFromPool(i),
    };
  });

  for (const data of itemsToCreate) {
    await prisma.item.create({ data: data });
  }

  console.log("Seeded 30 demo items (showroom) + sticky gameKey.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
