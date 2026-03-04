import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const res = await prisma.item.updateMany({
    data: { activationGoalEntries: 5 },
  });
  console.log(`OK: updated ${res.count} items → activationGoalEntries=5`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
