import Link from "next/link";
import { pwnit2HowItWorks } from "@/lib/pwnit2DemoCampaign";

export const metadata = { title: "How it works · PwnIt" };

const DISCIPLINES: { name: string; blurb: string }[] = [
  { name: "Memory", blurb: "Watch a growing colour sequence, then tap it back in order." },
  { name: "Find the numbers", blurb: "Tap the numbers 1, 2, 3… in order on a scrambled grid." },
  { name: "Quick maths", blurb: "Tap the correct answer to a short chain of sums." },
  { name: "Colour match", blurb: "Tap the colour a word is printed in — not the word itself." },
  { name: "What comes next", blurb: "Work out the rule and tap the next number in the sequence." },
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[#fffaf8] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Pick. Play. PwnIt.</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">How it works</h1>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-700">
          Pick a prize, play a quick skill game, and climb the leaderboard. When the countdown ends the top score
          wins the voucher — and everyone else keeps a discount they earned along the way.
        </p>

        <ol className="mt-6 space-y-3">
          {pwnit2HowItWorks.map((step, i) => (
            <li key={step.title} className="flex gap-4 rounded-3xl border border-[#e6ded9] bg-white p-5 shadow-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-black text-white">
                {i + 1}
              </span>
              <div>
                <h2 className="text-base font-black text-slate-950">{step.title}</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <section className="mt-8">
          <h2 className="text-lg font-black">The games</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
            One run is a gauntlet that rotates through five mini-games, getting harder as you go. How far you get
            is your score.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {DISCIPLINES.map((d, i) => (
              <div key={d.name} className="rounded-2xl border border-[#e6ded9] bg-white p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Game {i + 1}</p>
                <p className="mt-1 text-base font-black text-slate-950">{d.name}</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">{d.blurb}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-emerald-200 bg-[#f3faf7] p-5">
          <h2 className="text-lg font-black">Free play, winning &amp; buying</h2>
          <ul className="mt-2 space-y-2">
            {[
              "Your first competitive play each day is free and counts toward the leaderboard. Practice is always free and unlimited (practice runs don't count and earn no discount).",
              "Extra plays are R5 each. Every R1 you spend playing becomes R1 of discount on that voucher.",
              "When the countdown ends, the single highest score wins the voucher outright. 2nd and 3rd place get a bonus discount — an extra 10% and 5% of their paid spend.",
              "You can buy the voucher at any time for its value minus the discount you've earned — you never have to win to get it.",
            ].map((t, i) => (
              <li key={i} className="flex gap-2 text-sm font-semibold leading-6 text-slate-700">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/pwnit-2" className="rounded-full bg-[#0f172a] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#172554]">
            Back to campaigns
          </Link>
          <Link href="/play/pwnit-2" className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-800 transition hover:-translate-y-0.5 hover:bg-white">
            Play now
          </Link>
          <Link href="/legal/terms" className="rounded-full border border-[#e6ded9] bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:-translate-y-0.5 hover:bg-white">
            Terms &amp; policies
          </Link>
        </div>
      </div>
    </main>
  );
}
