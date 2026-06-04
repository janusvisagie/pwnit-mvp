import { BuyCreditsPanel } from "./ui";

export const dynamic = "force-dynamic";

export default function BuyCreditsPage() {
  return (
    <main className="min-h-screen bg-[#fffaf8] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl space-y-5">
        <div className="rounded-[2rem] border border-[#e6ded9] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">PwnIt</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Add credits</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-700">
            Credits let you play more and build your discount on the campaign voucher. Every R1 you
            spend on paid plays becomes R1 of discount on that voucher. You also get free daily
            credits to play with.
          </p>
        </div>

        <BuyCreditsPanel />
      </section>
    </main>
  );
}
