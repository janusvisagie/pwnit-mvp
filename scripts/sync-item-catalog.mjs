#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

function parseArgs(argv) {
  const args = {
    env: null,
    check: false,
    onlyGames: false,
    onlyCosts: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--env") {
      args.env = argv[i + 1] ?? null;
      i += 1;
    } else if (arg === "--check") {
      args.check = true;
    } else if (arg === "--only-games") {
      args.onlyGames = true;
    } else if (arg === "--only-costs") {
      args.onlyCosts = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  if (args.onlyGames && args.onlyCosts) {
    console.error("Use either --only-games or --only-costs, not both together.");
    process.exit(1);
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/sync-item-catalog.mjs [--env <file>] [--check] [--only-games] [--only-costs]

Examples:
  node scripts/sync-item-catalog.mjs --check
  node scripts/sync-item-catalog.mjs
  node scripts/sync-item-catalog.mjs --env .env.vercel.production --check
  node scripts/sync-item-catalog.mjs --env .env.vercel.production

Notes:
  - Without --env, the script tries .env.local first, then .env.
  - --check previews changes without writing them.
  - The script syncs the current 6-item catalog gameKey mapping and playCostCredits.
`);
}

function loadEnvFile(explicitPath) {
  const candidates = explicitPath
    ? [explicitPath]
    : [".env.local", ".env"];

  const resolved = candidates
    .map((file) => path.resolve(process.cwd(), file))
    .find((file) => fs.existsSync(file));

  if (!resolved) {
    throw new Error(`No env file found. Looked for: ${candidates.join(", ")}`);
  }

  const contents = fs.readFileSync(resolved, "utf8");
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(`DATABASE_URL was not found in ${resolved}`);
  }

  return resolved;
}

function playCostForPrize(prizeValueZAR) {
  const v = Math.max(0, Number(prizeValueZAR || 0));
  if (v <= 400) return 3;
  if (v <= 750) return 4;
  if (v <= 1200) return 5;
  if (v <= 2000) return 7;
  if (v <= 4000) return 10;
  if (v <= 8000) return 15;
  return 20;
}

const CATALOG_RULES = [
  {
    label: "Fuel Voucher",
    desiredGameKey: "hidden-pair-memory",
    matchers: [
      { field: "title", contains: "fuel voucher" },
      { field: "imageUrl", contains: "petrol-voucher" },
    ],
  },
  {
    label: "Checkers Voucher",
    desiredGameKey: "clue-ladder",
    matchers: [
      { field: "title", contains: "checkers voucher" },
      { field: "imageUrl", contains: "checkers-voucher" },
    ],
  },
  {
    label: "Takealot Voucher",
    desiredGameKey: "progressive-mosaic",
    matchers: [
      { field: "title", contains: "takealot voucher" },
      { field: "imageUrl", contains: "takealot-voucher" },
    ],
  },
  {
    label: "Sony WH-1000XM5 Headphones",
    desiredGameKey: "codebreaker",
    matchers: [
      { field: "title", contains: "sony wh-1000xm5" },
      { field: "title", contains: "sony xm5" },
      { field: "imageUrl", contains: "sony-xm5" },
    ],
  },
  {
    label: "Nintendo Switch OLED",
    desiredGameKey: "spot-the-missing",
    matchers: [
      { field: "title", contains: "nintendo switch oled" },
      { field: "title", contains: "nintendo switch" },
      { field: "imageUrl", contains: "nintendo-switch" },
    ],
  },
  {
    label: "GoPro HERO13 Black",
    desiredGameKey: "rapid-math-relay",
    matchers: [
      { field: "title", contains: "gopro hero13" },
      { field: "title", contains: "gopro hero" },
      { field: "imageUrl", contains: "gopro-hero" },
    ],
  },
];

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function findRuleForItem(item) {
  const title = normalize(item.title);
  const imageUrl = normalize(item.imageUrl);

  return (
    CATALOG_RULES.find((rule) =>
      rule.matchers.some((matcher) => {
        const haystack = matcher.field === "imageUrl" ? imageUrl : title;
        return haystack.includes(normalize(matcher.contains));
      }),
    ) ?? null
  );
}

function formatRow(item, desiredGameKey, desiredPlayCost) {
  return {
    id: item.id,
    title: item.title,
    currentGameKey: item.gameKey,
    desiredGameKey,
    currentPlayCostCredits: Number(item.playCostCredits ?? 0),
    desiredPlayCostCredits: desiredPlayCost,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const envFile = loadEnvFile(args.env);
  const prisma = new PrismaClient();

  try {
    const items = await prisma.item.findMany({
      orderBy: [{ createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        imageUrl: true,
        prizeValueZAR: true,
        playCostCredits: true,
        gameKey: true,
      },
    });

    console.log(`Loaded ${items.length} item(s) from ${envFile}`);
    const unmatched = [];
    const updates = [];

    for (const item of items) {
      const rule = findRuleForItem(item);
      if (!rule) {
        unmatched.push(item);
        continue;
      }

      const desiredPlayCost = playCostForPrize(item.prizeValueZAR);
      const desiredGameKey = rule.desiredGameKey;
      const nextData = {};

      if (!args.onlyCosts && item.gameKey !== desiredGameKey) {
        nextData.gameKey = desiredGameKey;
      }

      if (!args.onlyGames && Number(item.playCostCredits ?? 0) !== desiredPlayCost) {
        nextData.playCostCredits = desiredPlayCost;
      }

      if (Object.keys(nextData).length > 0) {
        updates.push({
          item,
          rule,
          desiredPlayCost,
          nextData,
        });
      }
    }

    if (unmatched.length > 0) {
      console.log("\nUnmatched item(s) left unchanged:");
      for (const item of unmatched) {
        console.log(`- ${item.title} (${item.id})`);
      }
    }

    if (updates.length === 0) {
      console.log("\nNo catalog changes needed.");
      return;
    }

    console.log(`\n${args.check ? "Planned" : "Applying"} ${updates.length} update(s):`);
    for (const update of updates) {
      const row = formatRow(update.item, update.rule.desiredGameKey, update.desiredPlayCost);
      console.log(`- ${row.title}`);
      console.log(`  id: ${row.id}`);
      if ("gameKey" in update.nextData) {
        console.log(`  gameKey: ${row.currentGameKey ?? "(null)"} -> ${row.desiredGameKey}`);
      }
      if ("playCostCredits" in update.nextData) {
        console.log(
          `  playCostCredits: ${row.currentPlayCostCredits} -> ${row.desiredPlayCostCredits}`,
        );
      }
    }

    if (args.check) {
      console.log("\nCheck mode only. No database writes were made.");
      return;
    }

    let written = 0;
    for (const update of updates) {
      await prisma.item.update({
        where: { id: update.item.id },
        data: update.nextData,
      });
      written += 1;
    }

    console.log(`\nDone. Updated ${written} item(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("\nSync failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
