import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Get the 9 items shown on the home grid
  const items = await prisma.item.findMany({
    orderBy: [{ tier: "asc" }, { createdAt: "asc" }],
    take: 9,
    select: { id: true, title: true },
  });

  if (items.length === 0) {
    console.log("No items found.");
    return;
  }

  const locked = items[items.length - 1]; // #9

  // Clear all locks, then lock only #9
  await prisma.item.updateMany({ data: { subscriberOnly: false } });
  await prisma.item.update({
    where: { id: locked.id },
    data: { subscriberOnly: true },
  });

  console.log(`Locked item #9: ${locked.title} (${locked.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
