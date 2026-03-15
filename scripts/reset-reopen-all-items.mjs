#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseArgs(argv) {
  const args = {
    execute: false,
    allowPurchases: false,
    mode: "full-reset",
    backupDir: "./tmp/pwnit-reset-backups",
  };

  for (const raw of argv) {
    if (raw === "--execute") args.execute = true;
    else if (raw === "--allow-purchases") args.allowPurchases = true;
    else if (raw.startsWith("--mode=")) args.mode = raw.split("=")[1] || args.mode;
    else if (raw.startsWith("--backup-dir=")) args.backupDir = raw.split("=")[1] || args.backupDir;
    else if (raw === "--help" || raw === "-h") args.help = true;
  }

  return args;
}

function printHelp() {
  console.log(`
PwnIt reset/reopen script

Usage:
  node scripts/reset-reopen-all-items.mjs --mode=reopen
  node scripts/reset-reopen-all-items.mjs --mode=full-reset
  node scripts/reset-reopen-all-items.mjs --mode=full-reset --execute
  node scripts/reset-reopen-all-items.mjs --mode=full-reset --execute --allow-purchases

Modes:
  reopen      Re-open all items only. History remains.
  full-reset  Re-open all items and remove item history (attempts, winners, rounds, purchases, item-linked ledgers).

Safety:
  - Dry-run by default. Nothing changes unless you add --execute.
  - A JSON backup snapshot is written before any destructive full reset.
  - If item purchases exist, full-reset refuses to run unless you add --allow-purchases.

Examples:
  node scripts/reset-reopen-all-items.mjs --mode=reopen --execute
  node scripts/reset-reopen-all-items.mjs --mode=full-reset --execute
`);
}

async function collectState() {
  const items = await prisma.item.findMany({
    orderBy: [{ tier: "asc" }, { createdAt: "asc" }],
    select: { id: true, title: true, state: true, closesAt: true, opensAt: true },
  });

  const itemIds = items.map((i) => i.id);
  const rounds = itemIds.length
    ? await prisma.itemRound.findMany({
        where: { itemId: { in: itemIds } },
        select: { id: true, itemId: true, sequence: true, state: true },
      })
    : [];
  const roundIds = rounds.map((r) => r.id);

  const [attempts, winners, purchases, ledgers, users] = await Promise.all([
    itemIds.length
      ? prisma.attempt.findMany({
          where: { itemId: { in: itemIds } },
          select: { id: true, itemId: true, userId: true, freeUsed: true, paidUsed: true, scoreMs: true },
        })
      : [],
    itemIds.length
      ? prisma.winner.findMany({
          where: { itemId: { in: itemIds } },
          select: { id: true, itemId: true, userId: true, rank: true, scoreMs: true },
        })
      : [],
    itemIds.length
      ? prisma.itemPurchase.findMany({
          where: { itemId: { in: itemIds } },
          select: { id: true, itemId: true, userId: true, payCredits: true, spentCredits: true, discountCredits: true },
        })
      : [],
    itemIds.length
      ? prisma.creditLedger.findMany({
          where: {
            OR: [{ itemId: { in: itemIds } }, roundIds.length ? { roundId: { in: roundIds } } : { id: "__never__" }],
          },
          select: { id: true, userId: true, itemId: true, roundId: true, kind: true, credits: true, note: true },
        })
      : [],
    prisma.user.findMany({
      select: { id: true, email: true, alias: true, freeCreditsBalance: true, paidCreditsBalance: true },
    }),
  ]);

  const refundByUser = new Map();
  for (const attempt of attempts) {
    const current = refundByUser.get(attempt.userId) || { free: 0, paid: 0 };
    current.free += Number(attempt.freeUsed ?? 0);
    current.paid += Number(attempt.paidUsed ?? 0);
    refundByUser.set(attempt.userId, current);
  }

  return {
    generatedAt: new Date().toISOString(),
    items,
    itemIds,
    rounds,
    roundIds,
    attempts,
    winners,
    purchases,
    ledgers,
    users,
    refundByUser: Object.fromEntries(refundByUser.entries()),
  };
}

function printSummary(snapshot, mode) {
  console.log(`\nMode: ${mode}`);
  console.log(`Items: ${snapshot.items.length}`);
  console.log(`Rounds: ${snapshot.rounds.length}`);
  console.log(`Attempts: ${snapshot.attempts.length}`);
  console.log(`Winners: ${snapshot.winners.length}`);
  console.log(`Purchases: ${snapshot.purchases.length}`);
  console.log(`Item-linked ledger rows: ${snapshot.ledgers.length}`);

  const refunds = Object.values(snapshot.refundByUser).reduce(
    (acc, row) => {
      acc.free += Number(row.free || 0);
      acc.paid += Number(row.paid || 0);
      return acc;
    },
    { free: 0, paid: 0 },
  );

  if (mode === "full-reset") {
    console.log(`Attempt credits to refund -> free: ${refunds.free}, paid: ${refunds.paid}`);
  }

  if (snapshot.purchases.length) {
    console.log(
      `\nWarning: ${snapshot.purchases.length} item purchase record(s) exist. Full reset will refuse unless --allow-purchases is supplied.`,
    );
  }
}

async function writeBackup(snapshot, backupDir) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  await fs.mkdir(backupDir, { recursive: true });
  const filePath = path.join(backupDir, `pwnit-reset-backup-${stamp}.json`);
  await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2), "utf8");
  return filePath;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  if (!["reopen", "full-reset"].includes(args.mode)) {
    throw new Error(`Unsupported mode: ${args.mode}`);
  }

  const snapshot = await collectState();
  printSummary(snapshot, args.mode);

  if (!args.execute) {
    console.log("\nDry-run only. Add --execute to apply changes.");
    return;
  }

  if (args.mode === "reopen") {
    const result = await prisma.item.updateMany({
      data: { state: "OPEN", closesAt: null, opensAt: new Date() },
    });
    console.log(`\nRe-opened ${result.count} item(s).`);
    return;
  }

  if (snapshot.purchases.length && !args.allowPurchases) {
    throw new Error(
      "Full reset aborted because item purchases exist. Re-run with --allow-purchases only if you are comfortable clearing purchase history too.",
    );
  }

  const backupPath = await writeBackup(snapshot, args.backupDir);
  console.log(`\nBackup written to ${backupPath}`);

  await prisma.$transaction(async (tx) => {
    const refundEntries = Object.entries(snapshot.refundByUser);
    for (const [userId, refund] of refundEntries) {
      const free = Number(refund.free || 0);
      const paid = Number(refund.paid || 0);
      if (!free && !paid) continue;
      await tx.user.update({
        where: { id: userId },
        data: {
          freeCreditsBalance: { increment: free },
          paidCreditsBalance: { increment: paid },
        },
      });
    }

    if (snapshot.roundIds.length) {
      await tx.creditLedger.deleteMany({
        where: {
          OR: [{ itemId: { in: snapshot.itemIds } }, { roundId: { in: snapshot.roundIds } }],
        },
      });
    } else {
      await tx.creditLedger.deleteMany({ where: { itemId: { in: snapshot.itemIds } } });
    }

    await tx.winner.deleteMany({ where: { itemId: { in: snapshot.itemIds } } });
    await tx.attempt.deleteMany({ where: { itemId: { in: snapshot.itemIds } } });
    await tx.itemPurchase.deleteMany({ where: { itemId: { in: snapshot.itemIds } } });
    await tx.itemRound.deleteMany({ where: { itemId: { in: snapshot.itemIds } } });
    await tx.item.updateMany({
      data: {
        state: "OPEN",
        closesAt: null,
        opensAt: new Date(),
      },
    });
  });

  console.log("\nFull item reset completed.");
  console.log("All items are OPEN again and item-linked history has been cleared.");
  console.log("Attempt credits were refunded to user balances using Attempt.freeUsed and Attempt.paidUsed.");
}

main()
  .catch((error) => {
    console.error("\nReset script failed:");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
