import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const deploymentEnv = process.env.VERCEL_ENV || process.env.NODE_ENV || "development";

if (deploymentEnv === "production" && process.env.PWNIT_ALLOW_PREVIEW_SEED_IN_PROD !== "1") {
  throw new Error("db:seed:preview is preview/dev-only and refuses to run in production.");
}

const PREVIEW_GAME_ASSIGNMENTS = [
  "flash-count",
  "alphabet-sprint",
  "target-grid",
  "quick-stop",
  "moving-zone",
  "trace-run",
];

async function main() {
  const items = await prisma.item.findMany({ orderBy: { createdAt: "asc" }, take: 6 });

  if (items.length < PREVIEW_GAME_ASSIGNMENTS.length) {
    throw new Error(`Expected at least ${PREVIEW_GAME_ASSIGNMENTS.length} items, found ${items.length}. Run db:seed first.`);
  }

  for (let idx = 0; idx < PREVIEW_GAME_ASSIGNMENTS.length; idx++) {
    await prisma.item.update({
      where: { id: items[idx].id },
      data: {
        gameKey: PREVIEW_GAME_ASSIGNMENTS[idx],
        state: "OPEN",
        closesAt: null,
      },
    });
  }

  console.log("Preview seed refreshed. Alphabet Sprint is enabled in preview without changing the production mix.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
