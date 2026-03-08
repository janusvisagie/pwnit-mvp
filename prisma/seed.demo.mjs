import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GAME_POOL = [
  "memory-sprint",
  "quick-stop",
  "moving-zone",
  "trace-run",
  "burst-match",
  "target-grid",
];

function pickFromPool(i) {
  return GAME_POOL[i % GAME_POOL.length];
}

async function main() {
  const now = new Date();
  const items = await prisma.item.findMany({ orderBy: { createdAt: "asc" }, take: 6 });

  for (let idx = 0; idx < items.length; idx++) {
    await prisma.item.update({
      where: { id: items[idx].id },
      data: {
        gameKey: pickFromPool(idx),
        state: "OPEN",
        closesAt: null,
      },
    });
  }

  console.log("Demo seed refreshed with 6 distinct games.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
