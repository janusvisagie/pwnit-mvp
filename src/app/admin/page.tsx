import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isLocalHost(host: string | null): boolean {
  if (!host) return false;
  const value = host.toLowerCase();
  return (
    value.startsWith("localhost:") ||
    value === "localhost" ||
    value.startsWith("127.0.0.1:") ||
    value === "127.0.0.1"
  );
}

export default async function AdminPage() {
  const host = headers().get("host");

  if (!isLocalHost(host)) {
    notFound();
  }

  try {
    const items = await prisma.item.findMany({
      orderBy: [{ tier: "asc" }, { createdAt: "asc" }],
    });

    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Admin (pilot)</h1>
          <p className="mt-1 text-sm text-slate-600">
            Read-only local view. Add CRUD endpoints when ready.
          </p>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">{item.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    State: {item.state} · Goal: {item.activationGoalEntries} · Countdown: {item.countdownMinutes}m · Tier: {item.tier}
                  </p>
                </div>
                <Link href={`/item/${item.id}`} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Open
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  } catch (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <h1 className="text-xl font-semibold">Admin unavailable</h1>
          <p className="mt-2 text-sm">
            The local admin page could not reach the database right now.
          </p>
          <p className="mt-2 text-xs opacity-80">{error instanceof Error ? error.message : "Unknown database error"}</p>
        </div>
      </main>
    );
  }
}
