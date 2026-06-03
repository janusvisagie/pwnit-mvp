import Link from "next/link";

const gates = [
  "Campaign-specific wallet and ledger rules",
  "Expiry rules for campaign-specific balances",
  "Clear separation from the old PwnIt 1 credit flow",
  "Activation and post-closure purchase-window rules",
  "Final operational review before payments are enabled",
];

const intendedFlow = [
  "Credits become campaign-specific value, not a general forever balance.",
  "The first MVP campaign should prove the one-voucher loop before multiple campaigns return.",
  "The old PwnIt 1 payment route remains paused until it matches the PwnIt 2 model.",
];

export default function BuyCreditsPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] border border-[#e1d4c5] bg-[#fffaf3] shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1fr_0.8fr]">
          <div className="relative overflow-hidden p-6 sm:p-8 lg:p-10">
            <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-[#d5a77f]/25 blur-3xl" />
            <div className="absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-[#91aa98]/25 blur-3xl" />

            <div className="relative space-y-4">
              <p className="inline-flex rounded-full bg-[#efe1d2] px-3 py-1 text-sm font-black text-[#7c5638] ring-1 ring-[#dbc7b1]">
                PwnIt 2.0 credits
              </p>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">Credits return as a campaign feature.</h1>
              <p className="max-w-2xl text-base leading-7 text-[#66584d] sm:text-lg">
                The credits page remains in the PwnIt 2 navigation, but live buying is still paused until the new single-campaign wallet, activation and expiry rules are implemented deliberately.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  className="rounded-full bg-[#2f3a32] px-5 py-3 text-sm font-black text-white transition hover:bg-[#3f4d43]"
                  href="/"
                >
                  Back to campaign
                </Link>
                <Link
                  className="rounded-full border border-[#cdbba7] bg-white px-5 py-3 text-sm font-black text-[#5f5047] transition hover:bg-[#fbf3ea]"
                  href="/pwnit-2"
                >
                  View lifecycle
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-[#e1d4c5] bg-[#2f3a32] p-6 text-white sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-sm backdrop-blur">
              <p className="text-sm font-black uppercase tracking-wide text-[#dfc7aa]">Current status</p>
              <h2 className="mt-2 text-2xl font-black">Purchase flow paused</h2>
              <p className="mt-3 text-sm leading-6 text-[#e1d7cb]">
                This is intentional. The PwnIt 2 payment experience needs to attach credits to the active campaign and the short post-closure purchase window, not to the old PwnIt 1 route assumptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[2rem] border border-[#e1d4c5] bg-[#fffaf3] p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">Intended PwnIt 2 flow</h2>
          <div className="mt-5 space-y-3">
            {intendedFlow.map((item) => (
              <div key={item} className="rounded-2xl bg-white p-4 text-sm font-bold leading-6 text-[#5f5047] ring-1 ring-[#e1d4c5]">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#e1d4c5] bg-[#fffaf3] p-6 shadow-sm">
          <h2 className="text-2xl font-black text-slate-950">Before live credits return</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {gates.map((gate) => (
              <div key={gate} className="rounded-2xl bg-white p-4 text-sm font-bold leading-6 text-[#5f5047] ring-1 ring-[#e1d4c5]">
                {gate}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
