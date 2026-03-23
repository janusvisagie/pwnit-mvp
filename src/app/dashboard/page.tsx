import Link from "next/link";

import { getCurrentActor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dayKeyZA } from "@/lib/time";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProfilePage() {
  const actor = await getCurrentActor();
  const user = actor.user;
  const dayKey = dayKeyZA();

  const [attemptsToday, winsToday] = await Promise.all([
    prisma.attempt.count({ where: { userId: user.id, dayKey } }),
    prisma.winner.count({ where: { userId: user.id, dayKey } }),
  ]);

  const wallet = Number(user.freeCreditsBalance ?? 0) + Number(user.paidCreditsBalance ?? 0);

  return (
    <main className="mx-auto max-w-4xl px-4 py-5 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Profile</div>
            <h1 className="mt-1 text-2xl font-black text-slate-950">Your activity</h1>
            <p className="mt-2 text-sm text-slate-600">
              {user.isGuest ? "Guest profile for this device." : `Signed in as ${user.email}`}
            </p>
          </div>

          <Link
            href="/"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900"
          >
            Back to home
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Wallet</div>
            <div className="mt-2 text-2xl font-black text-slate-950">{wallet}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attempts today</div>
            <div className="mt-2 text-2xl font-black text-slate-950">{attemptsToday}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Wins today</div>
            <div className="mt-2 text-2xl font-black text-slate-950">{winsToday}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
