import Link from "next/link";
import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/auth";
import { CountdownChip } from "@/components/CountdownChip";
import { playCostForPrize } from "@/lib/playCost";
import { settleItemWinners } from "@/lib/settle";
import { BuyNowButton } from "@/components/BuyNowButton";
import { getProductContent } from "@/lib/productCatalog";

function formatZAR(v: number) {
  return `R${Number(v || 0).toLocaleString("en-ZA")}`;
}

function stateLabel(s: string) {
  if (s === "OPEN") return "Open";
  if (s === "ACTIVATED") return "Activated";
  if (s === "CLOSED") return "Closed";
  if (s === "PUBLISHED") return "Results";
  return s || "Open";
}

export default async function ItemPage({ params }: { params: { id: string } }) {
  const me = await getOrCreateDemoUser();
  const itemId = params.id;
  const now = new Date();

  let item = await prisma.item.findUnique({ where: { id: itemId } });
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

  if (item.state === "ACTIVATED" && item.closesAt && now > item.closesAt) {
    await prisma.item.update({ where: { id: item.id }, data: { state: "CLOSED" } });
    item = { ...item, state: "CLOSED" } as any;
  }

  if (item.state === "CLOSED") {
    const already = await prisma.winner.count({ where: { itemId: item.id } });
    if (already === 0) {
      await settleItemWinners(item.id);
      item = { ...item, state: "PUBLISHED" } as any;
    }
  }

  const closesAtIso = item.closesAt ? item.closesAt.toISOString() : null;
  const playCost = playCostForPrize(item.prizeValueZAR);
  const totalEntries = await prisma.attempt.count({ where: { itemId: item.id } });

  const winners = await prisma.winner.findMany({
    where: { itemId },
    take: 200,
    select: { userId: true },
  });
  const meWon = winners.some((w) => w.userId === me.id);

  const isPlayable = item.state === "OPEN" || item.state === "ACTIVATED";
  const pct = Math.min(100, Math.round((totalEntries / Math.max(1, item.activationGoalEntries)) * 100));
  const remaining = Math.max(0, item.activationGoalEntries - totalEntries);
  const product = getProductContent(item.title, item.imageUrl);
  const displayImage = product?.imageUrl ?? item.imageUrl;

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold leading-tight text-slate-900 md:text-3xl">{item.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700">
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">{stateLabel(item.state)}</span>
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
              Prize: <span className="text-slate-900">{formatZAR(item.prizeValueZAR)}</span>
            </span>
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
              Cost: <span className="text-slate-900">{playCost}</span> {playCost === 1 ? "credit" : "credits"} / play
            </span>
            {item.state === "ACTIVATED" && closesAtIso ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                <span className="text-slate-500">Ends in</span>
                <CountdownChip state={item.state} closesAt={closesAtIso} />
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link className="text-sm font-semibold text-slate-900 hover:underline" href={`/item/${itemId}/leaderboard`}>
            Leaderboard
          </Link>
          {isPlayable ? (
            <Link
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-slate-800"
              href={`/play/${itemId}`}
            >
              Play
            </Link>
          ) : null}
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex min-h-[340px] items-center justify-center bg-gradient-to-br from-slate-100 to-white p-6 md:min-h-[420px]">
            {displayImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={displayImage} alt={item.title} className="max-h-[360px] w-auto object-contain" referrerPolicy="no-referrer" />
            ) : (
              <div className="text-sm text-slate-500">Image coming soon</div>
            )}
          </div>

          <div className="space-y-4 p-5">
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-slate-500">
                <span>Activation threshold</span>
                <span>{item.activationGoalEntries} plays</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-slate-900" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-900">
                  {Math.min(totalEntries, item.activationGoalEntries)} / {item.activationGoalEntries} plays
                </span>
                <span className="text-slate-600">{item.state === "ACTIVATED" ? "Activated" : `${remaining} to go`}</span>
              </div>
              {item.state === "ACTIVATED" && closesAtIso ? (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200">
                  <span>Ends in</span>
                  <CountdownChip state={item.state} closesAt={closesAtIso} />
                </div>
              ) : null}
            </div>

            {meWon ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
                🎉 You won this prize. No purchase needed.
              </div>
            ) : (
              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-extrabold text-slate-900">Didn’t win? Buy it by paying the difference.</div>
                <div className="mt-1 text-xs text-slate-600">Your paid credits spent on this prize reduce what you pay.</div>
                <div className="mt-3">
                  <BuyNowButton itemId={itemId} />
                </div>
              </section>
            )}

            <section className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                {product?.kicker ?? "Product details"}
              </div>
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
                  <a
                    href={product.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-900 ring-1 ring-slate-200 transition hover:bg-slate-100"
                  >
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
