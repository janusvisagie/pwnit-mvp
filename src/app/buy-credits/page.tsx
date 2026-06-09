import Link from "next/link";

export default function BuyCreditsPage() {
  return (
    <main className="min-h-screen bg-[#fffaf8] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl space-y-5">
        <div className="rounded-[2rem] border border-[#ecd8d0] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9f4d3d]">PwnIt 2.0</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Credits</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-700">
            You get one free competitive play a day, and practice is always free. Extra plays are R5 each, and every R1 you spend playing becomes R1 of discount on that voucher.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/" className="rounded-full bg-[#0f172a] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#172554]">
              Back to campaign
            </Link>
            <Link href="/play/pwnit-2" className="rounded-full border border-[#8bd7d0] bg-[#effdfb] px-5 py-3 text-sm font-black text-[#10645c] transition hover:-translate-y-0.5 hover:bg-white">
              Play game
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <InfoCard label="Free play" value="1 / day" />
          <InfoCard label="Practice" value="Free" />
          <InfoCard label="Extra play" value="R5" />
        </div>
      </section>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#ecd8d0] bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}
