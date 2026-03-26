import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const out = {};
  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const idx = line.indexOf("=");
    if (idx < 0) continue;

    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    out[key] = value;
  }

  return out;
}

function loadEnvLikeNext(rootDir) {
  const mode = process.env.NODE_ENV === "production" ? "production" : "development";
  const order = [`.env.${mode}.local`, ".env.local", `.env.${mode}`, ".env"];

  for (const name of order) {
    Object.assign(process.env, parseEnvFile(path.join(rootDir, name)));
  }
}

function sanitizeDbUrl(dbUrl) {
  if (!dbUrl) return "(not set)";
  try {
    const url = new URL(dbUrl);
    return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ""}${url.pathname}`;
  } catch {
    return dbUrl;
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), "..");
loadEnvLikeNext(root);

const args = new Set(process.argv.slice(2));
const execute = args.has("--execute");
const allowPurchases = args.has("--allow-purchases");

const prisma = new PrismaClient();

try {
  const dbUrl = process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL || "";
  console.log(`DB target: ${sanitizeDbUrl(dbUrl)}`);

  const [items, rounds, attempts, winners, purchases, ledgers] = await Promise.all([
    prisma.item.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.itemRound.findMany(),
    prisma.attempt.findMany(),
    prisma.winner.findMany(),
    prisma.itemPurchase.findMany(),
    prisma.creditLedger.findMany({ where: { itemId: { not: null } } }),
  ]);

  console.log(`Items: ${items.length}`);
  console.log(`Rounds: ${rounds.length}`);
  console.log(`Attempts: ${attempts.length}`);
  console.log(`Winners: ${winners.length}`);
  console.log(`Purchases: ${purchases.length}`);
  console.log(`Item-linked ledger rows: ${ledgers.length}`);

  if (purchases.length && !allowPurchases) {
    throw new Error(
      "Purchases exist. Re-run with --allow-purchases if you really want a destructive full reset.",
    );
  }

  const refunds = new Map();
  for (const attempt of attempts) {
    const current = refunds.get(attempt.userId) ?? { free: 0, paid: 0 };
    current.free += Number(attempt.freeUsed ?? 0);
    current.paid += Number(attempt.paidUsed ?? 0);
    refunds.set(attempt.userId, current);
  }

  const totalFreeRefund = [...refunds.values()].reduce((sum, row) => sum + row.free, 0);
  const totalPaidRefund = [...refunds.values()].reduce((sum, row) => sum + row.paid, 0);
  console.log(`Attempt credits to refund -> free: ${totalFreeRefund}, paid: ${totalPaidRefund}`);

  const backupDir = path.join(root, "tmp", "pwnit-reset-backups");
  ensureDir(backupDir);

  const backupPath = path.join(
    backupDir,
    `pwnit-reset-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );

  fs.writeFileSync(
    backupPath,
    JSON.stringify({ items, rounds, attempts, winners, purchases, ledgers }, null, 2),
  );
  console.log(`Backup written to ${path.relative(root, backupPath)}`);

  if (!execute) {
    console.log("Dry run only. Re-run with --execute to apply changes.");
    process.exit(0);
  }

  await prisma.$transaction(async (tx) => {
    for (const [userId, refund] of refunds.entries()) {
      await tx.user.update({
        where: { id: userId },
        data: {
          freeCreditsBalance: { increment: refund.free },
          paidCreditsBalance: { increment: refund.paid },
        },
      });
    }

    await tx.creditLedger.deleteMany({ where: { itemId: { not: null } } });
    await tx.winner.deleteMany({});
    await tx.attempt.deleteMany({});
    await tx.itemPurchase.deleteMany({});
    await tx.itemRound.deleteMany({});
    await tx.item.updateMany({ data: { state: "OPEN", closesAt: null } });
  });

  console.log("Full item reset completed.");
  console.log("All items are OPEN again and item-linked history has been cleared.");
} finally {
  await prisma.$disconnect();
}
