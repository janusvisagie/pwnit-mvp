import Link from "next/link";
import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/auth";
import { BuyNowButton } from "@/components/BuyNowButton";
import { CountdownChip } from "@/components/CountdownChip";
import { getProductContent } from "@/lib/productCatalog";
import { getGameMeta, compareScores } from "@/lib/gameRules";
import { publicProgress, syncRoundLifecycle } from "@/lib/rounds";

function formatZAR(v: number) {
  return `R${Number(v || 0).toLocaleString("en-ZA")}`;
}

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  const itemId = params.id;
  const me = await getOrCreateDemoUser();

  await syncRoundLifecycle(itemId);

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { rounds: { orderBy: [{ sequence: "desc" }], take: 1 } },
  });

  if (!item) {
    return (
      <main className="mx-auto max-w-3xl space-y-3 p-4">
        <h1 className="text-xl font-extrabold">Item not found</h1>
        <Link className="text-sm font-semibold text-slate-900 hover:underline" href="/">
          ← Back to Home
        </Link>
      </main>
    );
  }

  const round = item.rounds[0] ?? null;
  const progress = round ? publicProgress(round) : { pct: 0, label: "Starting", hot: false };
  const product = getProductContent(item.title, item.imageUrl);
  const displayImage = product?.imageUrl ?? item.imageUrl ?? null;
  const closesAtIso = (round?.closesAt ?? item.closesAt)?.toISOString?.() ?? null;
  const isPlayable = round ? ["BUILDING", "ACTIVATED"].includes(round.state) : item.state === "OPEN" || item.state === "ACTIVATED";
  const meWinner = round
    ? await prisma.winner.findFirst({ where: { roundId: round.id, userId: me.id, rank: 1, rewardType: "ITEM" }, select: { id: true } })
    : null;

  const attempts = round
    ? await prisma.attempt.findMany({
        where: {
          roundId: round.id,
          OR: [{ flags: null }, { NOT: { flags: { contains: '"valid":false' } } }],
        },
        orderBy: [{ createdAt: "asc" }],
        select: { userId: true, scoreMs: true, createdAt: true },
      })
    : [];

  const bestByUser = new Map<string, { userId: string; scoreMs: number; createdAt: Date }>();
  for (const attempt of attempts) {
    const current = bestByUser.get(attempt.userId);
    if (!current || compareScores(item.gameKey, attempt, current) < 0) bestByUser.set(attempt.userId, attempt);
  }
  const leaderboardRows = Array.from(bestByUser.values())
    .sort((a, b) => compareScores(item.gameKey, a, b))
    .slice(0, 5);
  const users = leaderboardRows.length
    ? await prisma.user.findMany({
        where: { id: { in: leaderboardRows.map((r) => r.userId) } },
        select: { id: true, alias: true, email: true },
      })
    : [];
  const aliasById = new Map(users.map((u) => [u.id, (u.alias && u.alias.trim()) || u.email.split("@")[0]]));
  const gameMeta = getGameMeta(item.gameKey);

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Prize</div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{item.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">{formatZAR(item.prizeValueZAR)}</span>
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">{gameMeta.label}</span>
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">{item.playCostCredits} credits/play</span>
            {closesAtIso && round?.state === "ACTIVATED" ? (
              <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">Ends in <CountdownChip state={round.state} closesAt={closesAtIso} /></span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link className="text-sm font-semibold text-slate-900 hover:underline" href={`/item/${itemId}/leaderboard`}>
            Leaderboard
          </Link>
          {isPlayable ? (
            <Link className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-slate-800" href={`/play/${itemId}`}>
              Play now
            </Link>
          ) : null}
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex min-h-[300px] items-center justify-center bg-gradient-to-br from-slate-100 to-white p-5 md:min-h-[360px] md:p-6">
            {displayImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={displayImage} alt={item.title} className="max-h-[300px] w-auto object-contain md:max-h-[330px]" referrerPolicy="no-referrer" />
            ) : (
              <div className="text-sm text-slate-500">Image coming soon</div>
            )}
          </div>

          <div className="space-y-3 p-4 md:p-5">
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-slate-500">
                <span>Activation threshold</span>
                <span>{round?.state === "ACTIVATED" || round?.state === "CLOSED" || round?.state === "PUBLISHED" ? "Activated" : progress.label}</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-slate-900 transition-all duration-500" style={{ width: `${progress.pct}%` }} />
              </div>
              <div className="mt-2 text-sm text-slate-700">
                {round?.state === "ACTIVATED" ? "The countdown is on. Play now to improve your position." : round?.state === "FAILED" || round?.state === "REFUNDED" ? "This prize did not go live in time. Paid credits used on this prize have been returned to wallets." : "Play now to compete and help this prize go live."}
              </div>
              {progress.hot && round?.state === "BUILDING" ? (
                <div className="mt-3 inline-flex items-center rounded-full bg-amber-300 px-3 py-1 text-xs font-extrabold text-slate-900">Hot</div>
              ) : null}
            </div>

            {meWinner ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
                🎉 You won this prize. No purchase needed.
              </div>
            ) : round?.state === "FAILED" || round?.state === "REFUNDED" ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
                This prize did not go live in time. Paid credits used on this prize have been returned to wallets.
              </div>
            ) : (
              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-extrabold text-slate-900">Didn’t win? Buy it by paying the difference.</div>
                <div className="mt-1 text-xs text-slate-600">Paid plays on this prize build your item-specific discount automatically.</div>
                <div className="mt-3">
                  <BuyNowButton itemId={itemId} />
                </div>
              </section>
            )}

            <section className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Leaderboard snapshot</div>
              <div className="mt-3 space-y-2">
                {leaderboardRows.length === 0 ? (
                  <div className="text-sm text-slate-600">No scores yet. Be the first to set the pace.</div>
                ) : leaderboardRows.map((row, idx) => (
                  <div key={row.userId} className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 ring-1 ring-slate-200">
                    <div className="text-sm font-semibold text-slate-900">#{idx + 1} {aliasById.get(row.userId) ?? "player"}</div>
                    <div className="text-sm font-bold text-slate-700">{gameMeta.formatScore(row.scoreMs)}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{product?.kicker ?? "Product details"}</div>
              <p className="mt-2 text-sm leading-6 text-slate-700">{product?.description ?? item.shortDesc ?? "Prize details coming soon."}</p>
              {product?.highlights?.length ? (
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {product.highlights.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-slate-900" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {product?.officialUrl ? (
                <div className="mt-4">
                  <a href={product.officialUrl} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-900 ring-1 ring-slate-200 transition hover:bg-slate-100">
                    View official product page
                  </a>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
