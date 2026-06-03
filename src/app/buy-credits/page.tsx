import Link from "next/link";

const gates = [
  "Campaign-specific wallet and ledger rules",
  "Expiry rules for campaign-specific balances",
  "Clear separation from the old PwnIt 1 credit flow",
  "Final compliance and operational review before payments are enabled",
];

export default function BuyCreditsPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1fr_0.8fr]">
          <div className="relative overflow-hidden p-6 sm:p-8 lg:p-10">
            <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-amber-300/30 blur-3xl" />
            <div className="absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-cyan-300/30 blur-3xl" />

            <div className="relative space-y-4">
              <p className="inline-flex rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-3 py-1 text-sm font-black text-white shadow-sm">
                PwnIt 2.0 credits
              </p>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">Credits page restored.</h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                This route is back in the PwnIt 2 navigation so the product shell is complete. Live credit purchases are not enabled on this branch yet, because the PwnIt 2 campaign-specific wallet rules still need to be implemented.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  className="rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                  href="/"
                >
                  Back to campaigns
                </Link>
                <Link
                  className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800"
                  href="/feedback"
                >
                  Give feedback
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-950 p-6 text-white sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-sm backdrop-blur">
              <p className="text-sm font-black uppercase tracking-wide text-amber-200">Current status</p>
              <h2 className="mt-2 text-2xl font-black">Purchase flow paused</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                The old PwnIt 1 purchase page is not reused as the main PwnIt 2 payment flow. This placeholder keeps the navigation stable while the new wallet model is built deliberately.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-slate-950">Before live credits return</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {gates.map((gate) => (
            <div key={gate} className="rounded-2xl bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-700 ring-1 ring-slate-200">
              {gate}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
