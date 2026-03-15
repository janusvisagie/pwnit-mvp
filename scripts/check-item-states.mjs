import { PrismaClient } from '@prisma/client';
import { loadEnvLikeNext, sanitizeDbUrl } from './_load-env-like-next.mjs';

loadEnvLikeNext(process.cwd());

const dbUrl = process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL || '';
console.log(`DB target: ${sanitizeDbUrl(dbUrl)}`);

const prisma = new PrismaClient();

try {
  const items = await prisma.item.findMany({ orderBy: { sortOrder: 'asc' } });
  console.log(`Items found: ${items.length}`);
  for (const item of items) {
    console.log(`${item.id}\t${item.title}\tstate=${item.state}\tclosesAt=${item.closesAt ? item.closesAt.toISOString() : 'null'}`);
  }
} finally {
  await prisma.$disconnect();
}
