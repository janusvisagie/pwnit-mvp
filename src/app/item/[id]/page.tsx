import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/auth";
import { dayKeyZA } from "@/lib/time";
import { CountdownChip } from "@/components/CountdownChip";
import { BuyNowButton } from "@/components/BuyNowButton";
import { getProductContent } from "@/lib/productCatalog";
import { activationProgress, activationStageLabel, playCostForPrize } from "@/lib/playCost";

function formatZAR(v: number) {
  return `R${Number(v || 0).toLocaleString("en-ZA")}`;
}

function stateLabel(state: string) {
  if (state === "ACTIVATED") return "Activated";
  if (state === "PUBLISHED") return "Results published";
  if (state === "CLOSED") return "Closed";
  return "Open";
}

export default async function ItemPage({ params }: { params: { id: string } }) {
  const itemId = params?.id;
  if (!itemId) notFound();

  const [me, item] = await Promise.all([
    getOrCreateDemoUser(),
    prisma.item.findUnique({ where: { id: itemId } }),
  ]);
  if (!item) notFound();

  const [agg, meWinner] = await Promise.all([
    prisma.attempt.aggregate({ where: { itemId }, _sum: { paidUsed: true } }),
    prisma.winner.findFirst({ where: { itemId, userId: me.id }, select: { id: true } }),
  ]);

  const progress = activationProgress(item.prizeValueZAR, Number(agg._sum.paidUsed ?? 0));
  const pct = progress.pct;
  const closesAtIso = item.closesAt ? item.closesAt.toISOString() : null;
  const isPlayable = item.state === "OPEN" || item.state === "ACTIVATED";
  const playCost = playCostForPrize(item.prizeValueZAR);
  const product = getProductContent(item.title, item.imageUrl);
  const displayImage = product?.imageUrl ?? item.imageUrl ?? null;

  return (
    <main className="mx-auto max-w-6xl space-y-3 p-3 md:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold leading-tight text-slate-900 md:text-3xl">{item.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700">
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">{stateLabel(item.state)}</span>
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">Prize: <span className="text-slate-900">{formatZAR(item.prizeValueZAR)}</span></span>
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">Cost: <span className="text-slate-900">{playCost}</span> {playCost === 1 ? "credit" : "credits"} / play</span>
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
            <Link className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-slate-800" href={`/play/${itemId}`}>
              Play
            </Link>
          ) : null}
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
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
                <span>Activation progress</span>
                <span>{item.state === "ACTIVATED" ? "Activated" : activationStageLabel(pct)}</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-slate-900 transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-900">{item.state === "ACTIVATED" ? "This prize is live." : "Community momentum is building."}</span>
                <span className="text-slate-600">{item.state === "ACTIVATED" ? "Countdown running" : pct >= 75 ? "Close" : "Not live yet"}</span>
              </div>
              {item.state === "ACTIVATED" && closesAtIso ? (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200">
                  <span>Ends in</span>
                  <CountdownChip state={item.state} closesAt={closesAtIso} />
                </div>
              ) : null}
            </div>

            {meWinner ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
                🎉 You won this prize. No purchase needed.
              </div>
            ) : (
              <section className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-extrabold text-slate-900">Didn’t win? Buy it by paying the difference.</div>
                <div className="mt-1 text-xs text-slate-600">Your paid play spend on this prize reduces the price automatically.</div>
                <div className="mt-3">
                  <BuyNowButton itemId={itemId} />
                </div>
              </section>
            )}

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
