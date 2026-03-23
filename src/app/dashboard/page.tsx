import Link from "next/link";

import { getCurrentActor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dayKeyZA } from "@/lib/time";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function gameLabel(k?: string | null) {
  if (!k) return "Mixed";
  if (k === "memory-sprint" || k === "number-memory") return "Memory Sprint";
  if (k === "alphabet-sprint" || k === "trace-run") return "Alphabet Sprint";
  if (k === "quick-stop" || k === "precision-timer" || k === "stop-zero") return "Quick Stop";
  if (k === "moving-zone" || k === "rhythm-hold") return "Moving Zone Hold";
  if (k === "flash-count" || k === "burst-match" || k === "tap-speed" || k === "tap-pattern") return "Flash Count";
  if (k === "target-grid" || k === "target-hold") return "Target Grid";
  return k.replace(/[-_]/g, " ");
}

function formatZAR(v: number) {
  return `R${Number(v || 0).toLocaleString("en-ZA")}`;
}

function formatDayKey(dayKey?: string | null) {
  if (!dayKey) return "";
  const d = new Date(`${dayKey}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dayKey;
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

function longestStreak(dayKeys: string[]) {
  if (!dayKeys.length) return 0;
  const dates = Array.from(new Set(dayKeys)).sort();
  let best = 1;
  let current = 1;

  for (let i = 1; i < dates.length; i += 1) {
    const prev = new Date(`${dates[i - 1]}T00:00:00`);
    const curr = new Date(`${dates[i]}T00:00:00`);
    const diff = (curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000);

    if (diff === 1) {
      current += 1;
      best = Math.max(best, current);
    } else if (diff > 1) {
      current = 1;
    }
  }

  return best;
}

export default async function ProfilePage() {
  const actor = await getCurrentActor();
  const user = actor.user;
  const dayKey = dayKeyZA();

  const [
    attemptsToday,
    winsToday,
    totalAttempts,
    allAttempts,
    allWinners,
    itemWins,
    walletUser,
  ] = await Promise.all([
    prisma.attempt.count({ where: { userId: user.id, dayKey } }),
    prisma.winner.count({ where: { userId: user.id, dayKey } }),
    prisma.attempt.count({ where: { userId: user.id } }),
    prisma.attempt.findMany({
      where: { userId: user.id },
      select: { dayKey: true, item: { select: { gameKey: true } } },
      orderBy: [{ createdAt: "desc" }],
    }),
    prisma.winner.findMany({
      where: { userId: user.id },
      include: { item: { select: { title: true, gameKey: true, prizeValueZAR: true } } },
      orderBy: [{ rank: "asc" }, { dayKey: "desc" }],
    }),
    prisma.winner.findMany({
      where: { userId: user.id, rewardType: "ITEM" },
      include: { item: { select: { prizeValueZAR: true } } },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { freeCreditsBalance: true, paidCreditsBalance: true },
    }),
  ]);

  const wallet =
    Number(walletUser?.freeCreditsBalance ?? user.freeCreditsBalance ?? 0) +
    Number(walletUser?.paidCreditsBalance ?? user.paidCreditsBalance ?? 0);

  const bestWinner = allWinners[0] ?? null;
  const streak = longestStreak(allAttempts.map((a) => a.dayKey).filter(Boolean) as string[]);
  const totalWinnings = itemWins.reduce(
    (sum, row) => sum + Number(row.item?.prizeValueZAR ?? 0),
    0,
  );
  const biggestPrize = itemWins.reduce(
    (max, row) => Math.max(max, Number(row.item?.prizeValueZAR ?? 0)),
    0,
  );

  const playedGames = new Set(
    allAttempts.map((a) => a.item?.gameKey).filter(Boolean) as string[],
  );

  const achievements = [
    { label: "First Win", desc: "Won any prize", done: itemWins.length > 0 },
    {
      label: "Speed Demon",
      desc: "Top 10 in Flash Count",
      done: allWinners.some(
        (w) =>
          (w.item?.gameKey === "flash-count" ||
            w.item?.gameKey === "tap-speed" ||
            w.item?.gameKey === "tap-pattern") &&
          Number(w.rank) <= 10,
      ),
    },
    {
      label: "Consistent",
      desc: "Played 7 days in a row",
      done: streak >= 7,
    },
    {
      label: "Big Winner",
      desc: "Win R1,000+ prize",
      done: biggestPrize >= 1000,
      progress:
        biggestPrize > 0 && biggestPrize < 1000 ? `${formatZAR(biggestPrize)} so far` : undefined,
    },
  ];

  const badges = [
    playedGames.has("flash-count") || playedGames.has("tap-speed") || playedGames.has("tap-pattern")
      ? "⚡ Speed Specialist"
      : null,
    playedGames.has("target-grid") || playedGames.has("target-hold")
      ? "🎯 Precision Pro"
      : null,
    playedGames.has("memory-sprint") || playedGames.has("number-memory")
      ? "🧠 Memory Master"
      : null,
  ].filter(Boolean) as string[];

  return (
    <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Profile</div>
            <h1 className="mt-1 text-2xl font-black text-slate-950">Your stats</h1>
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

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Games played</div>
            <div className="mt-2 text-2xl font-black text-slate-950">{totalAttempts}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Best rank</div>
            <div className="mt-2 text-2xl font-black text-slate-950">
              {bestWinner ? `#${bestWinner.rank}` : "—"}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              {bestWinner
                ? `${gameLabel(bestWinner.item?.gameKey)}, ${formatDayKey(bestWinner.dayKey)}`
                : "No ranked finish yet"}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total winnings</div>
            <div className="mt-2 text-2xl font-black text-slate-950">{formatZAR(totalWinnings)}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Streak</div>
            <div className="mt-2 text-2xl font-black text-slate-950">
              {streak} {streak > 0 ? "🔥" : ""}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
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

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Achievements unlocked
            </div>

            <div className="mt-4 space-y-3">
              {achievements.map((a) => (
                <div
                  key={a.label}
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    a.done
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="font-semibold">
                    {a.done ? "✓" : "○"} {a.label}
                  </div>
                  <div className="mt-1">{a.desc}</div>
                  {!a.done && a.progress ? <div className="mt-1 text-xs">{a.progress}</div> : null}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Badges</div>

            <div className="mt-4 flex flex-wrap gap-2">
              {badges.length ? (
                badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700 ring-1 ring-blue-200"
                  >
                    {badge}
                  </span>
                ))
              ) : (
                <div className="text-sm text-slate-600">Play more games to unlock badges.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
