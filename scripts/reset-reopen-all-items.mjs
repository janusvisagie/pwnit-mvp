import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { loadEnvLikeNext, sanitizeDbUrl } from './_load-env-like-next.mjs';

loadEnvLikeNext(process.cwd());

const args = new Set(process.argv.slice(2));
const execute = args.has('--execute');
const modeArg = [...args].find((a) => a.startsWith('--mode='));
const mode = modeArg ? modeArg.slice('--mode='.length) : 'reopen';
const allowPurchases = args.has('--allow-purchases');

if (!['reopen', 'full-reset'].includes(mode)) {
  console.error('Invalid mode. Use --mode=reopen or --mode=full-reset');
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL || '';
console.log(`DB target: ${sanitizeDbUrl(dbUrl)}`);

const prisma = new PrismaClient();

function backupPath() {
  const dir = path.join(process.cwd(), 'tmp', 'pwnit-reset-backups');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `pwnit-reset-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
}

try {
  const [items, rounds, attempts, winners, purchases, ledgers] = await Promise.all([
    prisma.item.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.itemRound.findMany(),
    prisma.attempt.findMany(),
    prisma.winner.findMany(),
    prisma.itemPurchase.findMany(),
    prisma.creditLedger.findMany(),
  ]);

  console.log(`\nMode: ${mode}${execute ? ' (execute)' : ''}`);
  console.log(`Items: ${items.length}`);
  console.log(`Rounds: ${rounds.length}`);
  console.log(`Attempts: ${attempts.length}`);
  console.log(`Winners: ${winners.length}`);
  console.log(`Purchases: ${purchases.length}`);
  console.log(`Item-linked ledger rows: ${ledgers.filter((x) => x.itemId).length}`);

  if (mode === 'full-reset' && purchases.length > 0 && !allowPurchases) {
    console.error('\nRefusing full-reset because ItemPurchase rows exist. Re-run with --allow-purchases only if you really want to wipe item history.');
    process.exit(1);
  }

  if (!execute) {
    console.log('\nDry run only. Add --execute to apply changes.');
    process.exit(0);
  }

  const snapshotFile = backupPath();
  fs.writeFileSync(snapshotFile, JSON.stringify({ items, rounds, attempts, winners, purchases, ledgers }, null, 2));
  console.log(`\nBackup written to ${path.relative(process.cwd(), snapshotFile)}`);

  await prisma.$transaction(async (tx) => {
    if (mode === 'full-reset') {
      await tx.creditLedger.deleteMany({ where: { itemId: { not: null } } });
      await tx.winner.deleteMany({});
      await tx.attempt.deleteMany({});
      await tx.itemRound.deleteMany({});
      if (allowPurchases) {
        await tx.itemPurchase.deleteMany({});
      }
    }

    await tx.item.updateMany({
      data: {
        state: 'OPEN',
        closesAt: null,
      },
    });
  });

  console.log(`\n${mode === 'full-reset' ? 'Full item reset completed.' : 'All items reopened.'}`);
  console.log('All items are OPEN again and closesAt has been cleared.');
} finally {
  await prisma.$disconnect();
}
