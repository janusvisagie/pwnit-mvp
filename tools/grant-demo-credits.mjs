import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const USERS = ["demo@local.test", "demo2@local.test", "demo3@local.test"];
const AMOUNT = 100; // change this if you want

async function main() {
  for (const email of USERS) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`Missing user: ${email} (run db:seed first)`);
      continue;
    }

    // Grant credits (LedgerTx.amount positive)
    await prisma.ledgerTx.create({
      data: {
        userId: user.id,
        type: "CREDIT_GRANT",
        amount: AMOUNT,
        memo: `dev grant: ${AMOUNT}`,
      },
    });

    console.log(`Granted ${AMOUNT} credits to ${email}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
