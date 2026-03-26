import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LIVE_GAME_ASSIGNMENTS = [
  "sequence-restore",
  "transform-memory",
  "route-builder",
  "codebreaker",
  "rule-lock",
  "balance-grid",
];

async function main() {
  const items = await prisma.item.findMany({ orderBy: { createdAt: "asc" }, take: 6 });

  for (let idx = 0; idx < items.length; idx += 1) {
    await prisma.item.update({
      where: { id: items[idx].id },
      data: {
        gameKey: LIVE_GAME_ASSIGNMENTS[idx],
        state: "OPEN",
        closesAt: null,
      },
    });
  }

  console.log("Demo seed refreshed with the puzzle-first 6-item mix.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
