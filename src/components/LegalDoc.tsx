import Link from "next/link";
import type { LegalDocData } from "@/lib/legalContent";

const TABS: { slug: "terms" | "refund" | "privacy"; label: string }[] = [
  { slug: "terms", label: "Terms" },
  { slug: "refund", label: "Refunds" },
  { slug: "privacy", label: "Privacy" },
];

export default function LegalDoc({ doc }: { doc: LegalDocData }) {
  return (
    <main className="min-h-screen bg-[#fffaf8] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Pick. Play. PwnIt.</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{doc.title}</h1>

        <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-900">
          Draft — under legal review and not yet binding. This is a working version for feedback; it is not legal
          advice and may change. Items in [square brackets] are still being finalised.
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Link
              key={t.slug}
              href={`/legal/${t.slug}`}
              className={`rounded-full px-4 py-1.5 text-sm font-black transition ${
                t.slug === doc.slug
                  ? "bg-[#0f172a] text-white"
                  : "border border-[#e6ded9] bg-white text-slate-700 hover:bg-emerald-50"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        <p className="mt-5 text-sm font-semibold leading-7 text-slate-700">{doc.intro}</p>

        <div className="mt-6 space-y-6">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-black text-slate-950">{section.heading}</h2>
              {section.paras?.map((p, i) => (
                <p key={i} className="mt-2 text-sm font-semibold leading-7 text-slate-700">
                  {p}
                </p>
              ))}
              {section.bullets ? (
                <ul className="mt-2 space-y-2">
                  {section.bullets.map((b, i) => (
                    <li key={i} className="flex gap-2 text-sm font-semibold leading-7 text-slate-700">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <p className="mt-8 border-t border-[#e6ded9] pt-4 text-xs font-semibold italic leading-6 text-slate-500">
          Effective date: {doc.updated} · Version: [•••]. This draft is provided to assist a legal consultation and
          must be reviewed and adapted by a qualified South African attorney before use.
        </p>
      </article>
    </main>
  );
}
