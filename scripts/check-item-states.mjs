#!/usr/bin/env node
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

function databaseHint() {
  const raw = process.env.DATABASE_URL || "";
  if (!raw) return "DATABASE_URL is not set";
  try {
    const url = new URL(raw);
    return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ""}${url.pathname || ""}`;
  } catch {
    return "DATABASE_URL is set (unable to parse safely)";
  }
}

try {
  const items = await prisma.item.findMany({
    orderBy: [{ tier: "asc" }, { createdAt: "asc" }],
    select: { id: true, title: true, state: true, opensAt: true, closesAt: true },
  });
  console.log(`Database: ${databaseHint()}`);
  for (const item of items) {
    console.log(`${item.title} | ${item.state} | opensAt=${item.opensAt?.toISOString?.() ?? "null"} | closesAt=${item.closesAt?.toISOString?.() ?? "null"}`);
  }
} finally {
  await prisma.$disconnect();
}
