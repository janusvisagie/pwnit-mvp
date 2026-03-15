import path from "node:path";
import process from "node:process";
import fs from "node:fs/promises";
import envPkg from "@next/env";
import { PrismaClient } from "@prisma/client";

const { loadEnvConfig } = envPkg;
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

function getArg(name, fallback = undefined) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function sanitizeDbUrl(url) {
  if (!url) return "(missing DATABASE_URL)";
  try {
    const u = new URL(url);
    const dbName = u.pathname?.replace(/^\//, "") || "(no-db-name)";
    return `${u.protocol}//${u.hostname}${u.port ? `:${u.port}` : ""}/${dbName}`;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}

async function backupSnapshot(snapshot) {
  const dir = path.join(process.cwd(), "tmp", "pwnit-reset-backups");
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `pwnit-reset-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  await fs.writeFile(file, JSON.stringify(snapshot, null, 2), "utf8");
  return path.relative(process.cwd(), file);
}

async function main() {
  const mode = getArg("mode", "reopen");
  const execute = hasFlag("execute");
  const allowPurchases = hasFlag("allow-purchases");

  if (!["reopen", "full-reset"].includes(mode)) {
    throw new Error(`Unsupported mode: ${mode}. Use --mode=reopen or --mode=full-reset`);
  }

  console.log(`DB target: ${sanitizeDbUrl(process.env.DATABASE_URL)}`);

  const [items, attempts, winners, rounds, purchases, itemLedgerRows] = await Promise.all([
    prisma.item.findMany({ orderBy: { id: "asc" } }),
    prisma.attempt.findMany({}),
    prisma.winner.findMany({}),
    prisma.itemRound.findMany({}),
    prisma.itemPurchase.findMany({}),
    prisma.creditLedger.findMany({ where: { itemId: { not: null } } }),
  ]);

  const refundByUser = new Map();
  for (const att of attempts) {
    const current = refundByUser.get(att.userId) ?? { freeCredits: 0, paidCredits: 0 };
    current.freeCredits += att.freeUsed ?? 0;
    current.paidCredits += att.paidUsed ?? 0;
    refundByUser.set(att.userId, current);
  }

  const totalFreeRefund = [...refundByUser.values()].reduce((s, r) => s + r.freeCredits, 0);
  const totalPaidRefund = [...refundByUser.values()].reduce((s, r) => s + r.paidCredits, 0);

  console.log("");
  console.log(`Mode: ${mode}${execute ? " (execute)" : " (dry-run)"}`);
  console.log(`Items: ${items.length}`);
  console.log(`Rounds: ${rounds.length}`);
  console.log(`Attempts: ${attempts.length}`);
  console.log(`Winners: ${winners.length}`);
  console.log(`Purchases: ${purchases.length}`);
  console.log(`Item-linked ledger rows: ${itemLedgerRows.length}`);
  console.log(`Attempt credits to refund -> free: ${totalFreeRefund}, paid: ${totalPaidRefund}`);

  if (mode === "full-reset" && purchases.length > 0 && !allowPurchases) {
    console.log("");
    console.log("Refusing full-reset because purchases exist.");
    console.log("Re-run with --allow-purchases only if you are sure you want to clear item-linked history even with purchases present.");
    process.exit(1);
  }

  if (!execute) {
    console.log("");
    console.log("Dry-run only. No changes were made.");
    return;
  }

  const backupPath = await backupSnapshot({
    databaseTarget: sanitizeDbUrl(process.env.DATABASE_URL),
    createdAt: new Date().toISOString(),
    mode,
    items,
    attempts,
    winners,
    rounds,
    purchases,
    itemLedgerRows,
    refundByUser: Object.fromEntries(refundByUser.entries()),
  });

  console.log("");
  console.log(`Backup written to ${backupPath}`);

  await prisma.$transaction(async (tx) => {
    if (mode === "full-reset") {
      for (const [userId, refund] of refundByUser.entries()) {
        await tx.user.update({
          where: { id: userId },
          data: {
            freeCredits: { increment: refund.freeCredits },
            paidCredits: { increment: refund.paidCredits },
          },
        });
      }

      await tx.creditLedger.deleteMany({ where: { itemId: { not: null } } });
      await tx.itemPurchase.deleteMany({});
      await tx.winner.deleteMany({});
      await tx.attempt.deleteMany({});
      await tx.itemRound.deleteMany({});
    }

    await tx.item.updateMany({
      data: {
        state: "OPEN",
        closesAt: null,
      },
    });
  });

  console.log("");
  if (mode === "reopen") {
    console.log("Reopen completed. All items are OPEN again.");
  } else {
    console.log("Full item reset completed.");
    console.log("All items are OPEN again and item-linked history has been cleared.");
    console.log("Attempt credits were refunded to user balances using Attempt.freeUsed and Attempt.paidUsed.");
  }
}

main()
  .catch((err) => {
    console.error("");
    console.error(err?.stack || String(err));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
