import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GAME_ASSIGNMENTS = [
  "burst-match",
  "memory-sprint",
  "target-grid",
  "quick-stop",
  "moving-zone",
  "trace-run",
];

async function main() {
  const items = await prisma.item.findMany({ orderBy: { createdAt: "asc" }, take: 6 });

  for (let idx = 0; idx < items.length; idx++) {
    await prisma.item.update({
      where: { id: items[idx].id },
      data: {
        gameKey: GAME_ASSIGNMENTS[idx],
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
