#!/usr/bin/env node
// scripts/backup-db.mjs
// Production-safe database export for PwnIt 2 (PostgreSQL).
//
//   npm run db:backup            -> dumps the DB in DATABASE_URL
//   npm run db:backup:prod       -> dumps the DB in PROD_DATABASE_URL
//   node scripts/backup-db.mjs --dump   -> custom-format (.dump) instead of plain .sql
//
// Writes a timestamped file into ./backups (which is gitignored), prints the path,
// and NEVER prints database credentials. Fails safely if the URL is missing or pg_dump
// is not installed. This script only READS the database.

import { spawnSync } from "node:child_process";
import { mkdirSync, existsSync, statSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const useProd = args.includes("--prod");
const customFormat = args.includes("--dump");
const envVar = useProd ? "PROD_DATABASE_URL" : "DATABASE_URL";
const url = process.env[envVar];

function die(msg) {
  console.error(`\n[backup-db] ERROR: ${msg}\n`);
  process.exit(1);
}

if (!url) {
  die(
    `${envVar} is not set. Set it for this shell and retry, e.g.\n` +
      (useProd
        ? `  PowerShell:  $env:PROD_DATABASE_URL="postgresql://USER:***@HOST:5432/DB"; npm run db:backup:prod`
        : `  PowerShell:  $env:DATABASE_URL="postgresql://USER:***@HOST:5432/DB"; npm run db:backup`) +
      `\n(Never paste a production URL into a committed file.)`,
  );
}

// Redact credentials for logging — only ever show host + database name.
let safeTarget = "(unparseable url)";
try {
  const u = new URL(url);
  safeTarget = `${u.hostname}${u.port ? ":" + u.port : ""}${u.pathname}`;
} catch {
  // leave safeTarget as-is; still never logs the raw url
}

const now = new Date();
const p = (n) => String(n).padStart(2, "0");
const stamp = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}-${p(now.getHours())}-${p(
  now.getMinutes(),
)}-${p(now.getSeconds())}`;

const outDir = resolve(process.cwd(), "backups");
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const ext = customFormat ? "dump" : "sql";
const outFile = resolve(outDir, `pwnit-db-backup-${stamp}.${ext}`);

console.log(`[backup-db] Source : ${safeTarget}${useProd ? "  (PROD)" : ""}`);
console.log(`[backup-db] Output : ${outFile}`);
console.log(`[backup-db] Running pg_dump…`);

// Allow a custom pg_dump path (handy on Windows): set PG_DUMP_PATH.
const pgDump = process.env.PG_DUMP_PATH || "pg_dump";

const dumpArgs = [
  `--dbname=${url}`,
  "--no-owner",
  "--no-privileges",
  ...(customFormat ? ["--format=custom"] : ["--format=plain"]),
  `--file=${outFile}`,
];

const res = spawnSync(pgDump, dumpArgs, { stdio: ["ignore", "inherit", "inherit"] });

if (res.error && res.error.code === "ENOENT") {
  die(
    `pg_dump was not found on PATH.\n` +
      `Install the PostgreSQL client tools, or set PG_DUMP_PATH to the full path of pg_dump, e.g.\n` +
      `  PowerShell:  $env:PG_DUMP_PATH="C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe"\n` +
      `(Use a pg_dump version >= your server's major version.)`,
  );
}
if (res.status !== 0) {
  die(`pg_dump exited with code ${res.status}. The backup file may be incomplete; do not rely on it.`);
}

let sizeNote = "";
try {
  const bytes = statSync(outFile).size;
  sizeNote = ` (${(bytes / 1024).toFixed(1)} KB)`;
} catch {
  /* ignore */
}

console.log(`\n[backup-db] ✓ Backup complete${sizeNote}`);
console.log(`[backup-db]   ${outFile}`);
console.log(`[backup-db]   Keep this file somewhere safe. It is gitignored and will NOT be committed.\n`);
