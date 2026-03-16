import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function loadEnvLikeNext(rootDir) {
  const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  const order = [`.env.${mode}.local`, '.env.local', `.env.${mode}`, '.env'];
  for (const name of order) Object.assign(process.env, parseEnvFile(path.join(rootDir, name)));
}

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
loadEnvLikeNext(root);
const prisma = new PrismaClient();
try {
  const count = await prisma.item.count();
  await prisma.item.updateMany({ data: { state: 'OPEN', closesAt: null } });
  console.log(`Reopened ${count} item(s).`);
} finally {
  await prisma.$disconnect();
}
