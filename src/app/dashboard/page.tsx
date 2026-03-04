// src/app/dashboard/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/db";
import { dayKeyZA } from "@/lib/time";
import { getOrCreateDemoUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getOrCreateDemoUser();
  const dayKey = dayKeyZA();

  const attemptsToday = await prisma.attempt.count({
    where: { userId: user.id, dayKey },
  });

  const winsToday = await prisma.winner.count({
    where: { userId: user.id, dayKey },
  });

  return (
    <main className="py-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-extrabold tracking-tight">Dashboard</div>
          <div className="text-sm text-slate-600">
            User: <span className="font-semibold text-slate-900">{user.email}</span>
          </div>
        </div>

        <Link className="text-sm font-semibold text-slate-900 hover:underline" href="/">
          Home
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold text-slate-500">Credits</div>
          <div className="mt-1 text-2xl font-extrabold">{user.paidCreditsBalance}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold text-slate-500">Attempts today</div>
          <div className="mt-1 text-2xl font-extrabold">{attemptsToday}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold text-slate-500">Wins today</div>
          <div className="mt-1 text-2xl font-extrabold">{winsToday}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
        If credits here don’t match what you expect, it usually means you’re on a different demo user
        than you think (cookie mismatch) or the switch endpoint isn’t updating the session cookie consistently.
      </div>
    </main>
  );
}
