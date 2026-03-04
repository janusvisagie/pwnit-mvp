import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function imageForTier(tier) {
  if (tier === 1) return "/dummy/bronze.svg";
  if (tier === 2) return "/dummy/silver.svg";
  if (tier === 3) return "/dummy/gold.svg";
  return "/dummy/platinum.svg";
}

async function main() {
  const items = await prisma.item.findMany({ select: { id: true, tier: true } });

  for (const it of items) {
    await prisma.item.update({
      where: { id: it.id },
      data: {
        activationGoalEntries: 5,
        countdownMinutes: 1,
        imageUrl: imageForTier(it.tier),
      },
    });
  }

  console.log(`Updated ${items.length} items: activationGoalEntries=5, countdownMinutes=1, imageUrl set`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
