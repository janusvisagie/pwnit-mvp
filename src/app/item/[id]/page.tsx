import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getOrCreateDemoUser } from "@/lib/auth";
import { CountdownChip } from "@/components/CountdownChip";
import { BuyNowButton } from "@/components/BuyNowButton";
import { getFallbackProductImage, getProductContent } from "@/lib/productCatalog";
import { activationProgress, activationStageLabel, playCostForPrize } from "@/lib/playCost";
import { ProductImage } from "@/components/ProductImage";

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

  try {
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
    const fallbackImage = getFallbackProductImage(item.title, item.imageUrl);

    return (
      <main className="mx-auto w-full max-w-6xl space-y-3 px-3 pb-4 sm:px-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold leading-tight text-slate-900 md:text-3xl">{item.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-700 sm:text-xs">
              <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">{stateLabel(item.state)}</span>
              <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                Prize: <span className="text-slate-900">{formatZAR(item.prizeValueZAR)}</span>
              </span>
              <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                Cost: <span className="text-slate-900">{playCost}</span> credits / play
              </span>
              {item.state === "ACTIVATED" && closesAtIso ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                  <span className="text-slate-500">Ends in</span>
                  <CountdownChip state={item.state} closesAt={closesAtIso} />
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
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
            <div className="flex min-h-[220px] items-center justify-center bg-gradient-to-br from-slate-100 to-white p-4 md:min-h-[320px] md:p-6">
              <ProductImage
                primarySrc={product?.imageUrl ?? null}
                fallbackSrc={fallbackImage}
                alt={item.title}
                className="flex min-h-[220px] w-full items-center justify-center md:min-h-[320px]"
                imgClassName="max-h-[220px] w-auto object-contain md:max-h-[330px]"
                unavailableLabel="Image coming soon"
              />
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
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
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
  } catch {
    return (
      <main className="mx-auto w-full max-w-3xl space-y-3 px-4 py-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-base font-extrabold text-slate-900">We couldn’t load this prize right now.</div>
          <div className="mt-1 text-sm text-slate-600">Please return to the home page and try again in a moment.</div>
          <div className="mt-4">
            <Link className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white" href="/">
              Back to home
            </Link>
          </div>
        </div>
      </main>
    );
  }
}
