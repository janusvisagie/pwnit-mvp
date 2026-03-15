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
    const primaryImage = product?.imageUrl ?? item.imageUrl ?? fallbackImage;
    const highlights = product?.highlights ?? [];
    const detailText = product?.description ?? item.shortDesc ?? "Prize details coming soon.";
    const officialUrl = product?.officialUrl ?? item.productUrl ?? null;

    return (
      <main className="mx-auto w-full max-w-6xl space-y-2 px-3 pb-4 pt-2 sm:px-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold leading-tight text-slate-900 md:text-[1.85rem]">
              {item.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-700 sm:text-xs">
              <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">
                {stateLabel(item.state)}
              </span>
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
          <div className="grid gap-0 lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,1.08fr)] lg:items-stretch">
            <div className="flex min-h-[210px] items-center justify-center bg-gradient-to-br from-slate-100 to-white p-4 md:min-h-[250px] md:p-5 lg:min-h-[320px] lg:p-5">
              <ProductImage
                primarySrc={primaryImage}
                fallbackSrc={fallbackImage}
                alt={item.title}
                className="flex h-full min-h-[210px] w-full items-center justify-center md:min-h-[250px] lg:min-h-0"
                imgClassName="max-h-[210px] w-auto object-contain md:max-h-[250px] lg:max-h-[285px]"
                unavailableLabel="Image coming soon"
              />
            </div>

            <div className="grid gap-2 p-3 md:gap-3 md:p-4 lg:grid-rows-[auto_auto_1fr]">
              <section className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <span>Activation progress</span>
                  <span>{item.state === "ACTIVATED" ? "Activated" : activationStageLabel(pct)}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-slate-900 transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[13px]">
                  <span className="font-semibold text-slate-900">
                    {item.state === "ACTIVATED" ? "This prize is live." : "Community momentum is building."}
                  </span>
                  <span className="text-slate-600">
                    {item.state === "ACTIVATED" ? "Countdown running" : pct >= 75 ? "Close" : "Not live yet"}
                  </span>
                </div>
                {item.state === "ACTIVATED" && closesAtIso ? (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200">
                    <span>Ends in</span>
                    <CountdownChip state={item.state} closesAt={closesAtIso} />
                  </div>
                ) : null}
              </section>

              {meWinner ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">
                  You won this prize. No purchase needed.
                </div>
              ) : (
                <section className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="text-sm font-extrabold text-slate-900">
                    Didn’t win? Buy it by paying the difference.
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Your paid play spend on this prize reduces the price automatically.
                  </div>
                  <div className="mt-3">
                    <BuyNowButton itemId={itemId} />
                  </div>
                </section>
              )}

              <section className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {product?.kicker ?? "Product details"}
                </div>

                <div className="mt-2 grid gap-3 lg:grid-cols-[minmax(0,1.08fr)_minmax(220px,0.92fr)] lg:items-start">
                  <div>
                    <p className="text-sm leading-5 text-slate-700">{detailText}</p>
                  </div>

                  <div className="space-y-3">
                    {highlights.length ? (
                      <ul className="grid gap-1.5 text-[13px] leading-5 text-slate-700">
                        {highlights.map((line) => (
                          <li key={line} className="flex gap-2">
                            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-900" />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {officialUrl ? (
                      <a
                        href={officialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-900 ring-1 ring-slate-200 transition hover:bg-slate-100"
                      >
                        View official product page
                      </a>
                    ) : null}
                  </div>
                </div>
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
          <div className="mt-1 text-sm text-slate-600">
            Please return to the home page and try again in a moment.
          </div>
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
