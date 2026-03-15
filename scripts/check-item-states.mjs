import process from 'node:process';
import envPkg from '@next/env';
import { PrismaClient } from '@prisma/client';

const { loadEnvConfig } = envPkg;
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

function sanitizeDbUrl(url) {
  if (!url) return '(missing DATABASE_URL)';
  try {
    const u = new URL(url);
    const dbName = u.pathname?.replace(/^\//, '') || '(no-db-name)';
    return `${u.protocol}//${u.hostname}${u.port ? `:${u.port}` : ''}/${dbName}`;
  } catch {
    return '(unparseable DATABASE_URL)';
  }
}

async function main() {
  console.log(`DB target: ${sanitizeDbUrl(process.env.DATABASE_URL)}`);
  const items = await prisma.item.findMany({ orderBy: { id: 'asc' } });
  console.log(`Items found: ${items.length}`);
  for (const item of items) {
    console.log(`${item.id}\t${item.title}\tstate=${item.state}\tclosesAt=${item.closesAt ? item.closesAt.toISOString() : 'null'}`);
  }
}

main()
  .catch((err) => {
    console.error(err?.stack || String(err));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
