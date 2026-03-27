import Link from "next/link";

import { getCurrentActor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dayKeyZA } from "@/lib/time";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProfilePage() {
  try {
    const actor = await getCurrentActor();
    const user = actor.user;
    const dayKey = dayKeyZA();
    const [attemptsToday, winsToday] = await Promise.all([
      prisma.attempt.count({ where: { userId: user.id, dayKey } }),
      prisma.winner.count({ where: { userId: user.id, dayKey } }),
    ]);
    const freeCredits = Number(user.freeCreditsBalance ?? 0);
    const paidCredits = Number(user.paidCreditsBalance ?? 0);
    const wallet = freeCredits + paidCredits;

    return (
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Profile</div>
            <h1 className="mt-1 text-3xl font-black text-slate-950">Your activity</h1>
          </div>
          <Link href="/" className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900">
            Back to home
          </Link>
        </div>

        <p className="mt-3 text-sm text-slate-600">{user.isGuest ? "Guest profile for this device." : `Signed in as ${user.email}`}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Wallet</div>
            <div className="mt-2 text-3xl font-black text-slate-950">{wallet}</div>
            <div className="mt-2 text-xs text-slate-500">Free {freeCredits} • Paid {paidCredits}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attempts today</div>
            <div className="mt-2 text-3xl font-black text-slate-950">{attemptsToday}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Wins today</div>
            <div className="mt-2 text-3xl font-black text-slate-950">{winsToday}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</div>
            <div className="mt-2 text-lg font-black text-slate-950">{user.isGuest ? "Guest" : "Member"}</div>
          </div>
        </div>
      </main>
    );
  } catch {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6">
        <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Profile</div>
        <h1 className="mt-1 text-3xl font-black text-slate-950">We couldn’t load your profile right now.</h1>
        <p className="mt-3 text-sm text-slate-600">Please return to the home page and try again in a moment.</p>
        <Link href="/" className="mt-6 inline-flex rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white">
          Back to home
        </Link>
      </main>
    );
  }
}
