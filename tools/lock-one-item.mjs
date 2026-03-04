import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Pick the first item (by createdAt) and lock it
  const item = await prisma.item.findFirst({ orderBy: { createdAt: "asc" } });
  if (!item) {
    console.log("No items found.");
    return;
  }

  await prisma.item.update({
    where: { id: item.id },
    data: { subscriberOnly: true },
  });

  console.log("Locked subscriber-only item:", item.id, item.title);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
