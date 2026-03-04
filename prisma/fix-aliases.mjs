import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizeAlias(raw) {
  return String(raw ?? "").trim().replace(/\s+/g, "_");
}

function isValidAlias(raw) {
  return /^[a-zA-Z0-9_]{3,16}$/.test(raw);
}

async function generateUniqueAlias(prefix = "PwnIt") {
  for (let i = 0; i < 50; i++) {
    const suffix = Math.floor(1000 + Math.random() * 9000); // 1000-9999
    const alias = `${prefix}_${suffix}`;
    const exists = await prisma.user.findFirst({ where: { alias }, select: { id: true } });
    if (!exists) return alias;
  }
  return `${prefix}_${Date.now().toString().slice(-6)}`;
}

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, alias: true, aliasSetByUser: true },
    orderBy: { createdAt: "asc" },
  });

  // Track first occurrence of each alias
  const seen = new Map();

  for (const u of users) {
    const current = normalizeAlias(u.alias);

    // Treat empty string as "unset"
    if (!current) {
      const newAlias = await generateUniqueAlias("PwnIt");
      await prisma.user.update({
        where: { id: u.id },
        data: { alias: newAlias, aliasSetByUser: false },
      });
      continue;
    }

    // If alias invalid, replace
    if (!isValidAlias(current)) {
      const newAlias = await generateUniqueAlias("PwnIt");
      await prisma.user.update({
        where: { id: u.id },
        data: { alias: newAlias, aliasSetByUser: false },
      });
      continue;
    }

    // If duplicate, keep first, change the rest
    if (seen.has(current)) {
      const newAlias = await generateUniqueAlias("PwnIt");
      await prisma.user.update({
        where: { id: u.id },
        data: { alias: newAlias, aliasSetByUser: false },
      });
      continue;
    }

    // Normalize stored alias (optional but nice)
    if (current !== u.alias) {
      await prisma.user.update({
        where: { id: u.id },
        data: { alias: current },
      });
    }

    seen.set(current, u.id);
  }

  console.log("✅ Aliases deduped / generated.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
