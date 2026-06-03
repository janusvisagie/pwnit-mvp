import Link from "next/link";

export default function BuyCreditsPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d7fbf7_0,#fff7f2_32%,#ffffff_70%)] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-[#0f766e] p-7 text-white sm:p-10">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#8de3dd]">PwnIt 2 credits</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Credits route reserved</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200">
            This page is back in the PwnIt 2 navigation so the product structure feels complete, but the credit purchase flow is intentionally not active in this foundation build.
          </p>
        </div>

        <div className="grid gap-4 p-6 sm:p-8 md:grid-cols-3">
          <div className="rounded-2xl border border-[#aee9e3] bg-[#f0fdfa] p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0f766e]">Status</p>
            <p className="mt-2 text-2xl font-black text-slate-950">Disabled</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">No checkout is enabled from this PwnIt 2 placeholder page.</p>
          </div>

          <div className="rounded-2xl border border-[#f3c2b1] bg-[#fff7f2] p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#b85f4f]">Purpose</p>
            <p className="mt-2 text-2xl font-black text-slate-950">UX slot</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">This keeps the future credits area visible while the PwnIt 2 flow is converted.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Next</p>
            <p className="mt-2 text-2xl font-black text-slate-950">Design</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">The next implementation step is a database-backed single campaign.</p>
          </div>
        </div>

        <div className="border-t border-slate-100 p-6 sm:p-8">
          <div className="rounded-2xl bg-slate-50 p-5">
            <h2 className="text-xl font-black text-slate-950">What changed?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The old redirect to the legacy payment page has been replaced with a PwnIt 2 status page. This prevents the old payment route from being presented as the new model while keeping the navigation item available for testing the shell.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800">
              Back to campaign
            </Link>
            <Link
              href="/pwnit-2"
              className="rounded-full border border-[#ef8f75] bg-[#fff7f2] px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-[#ffe6dc]"
            >
              View lifecycle
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
