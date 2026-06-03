import Link from "next/link";

export type Pwnit2CampaignCardModel = {
  title: string;
  category: string;
  statusLabel: string;
  statusTone: "funding" | "countdown" | "closed";
  baseValueLabel: string;
  currentValueLabel: string;
  activationPct: number;
  helper: string;
  primaryMetricLabel: string;
  primaryMetricValue: string;
  secondaryMetricLabel: string;
  secondaryMetricValue: string;
};

const toneClasses: Record<Pwnit2CampaignCardModel["statusTone"], string> = {
  funding: "border-amber-200 bg-amber-50 text-amber-800",
  countdown: "border-cyan-200 bg-cyan-50 text-cyan-800",
  closed: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

export default function Pwnit2CampaignCard({ campaign }: { campaign: Pwnit2CampaignCardModel }) {
  const pct = Math.max(0, Math.min(100, Math.round(campaign.activationPct || 0)));

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-100 via-white to-cyan-100 p-5">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-300/40 blur-2xl" />
        <div className="absolute -bottom-10 left-8 h-24 w-24 rounded-full bg-cyan-300/40 blur-2xl" />

        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{campaign.category}</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{campaign.title}</h3>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${toneClasses[campaign.statusTone]}`}>
            {campaign.statusLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Base value</p>
            <p className="mt-1 text-xl font-black text-slate-950">{campaign.baseValueLabel}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Current value</p>
            <p className="mt-1 text-xl font-black text-slate-950">{campaign.currentValueLabel}</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm font-bold text-slate-600">
            <span>Activation</span>
            <span>{pct}%</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-400" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <p className="text-sm leading-6 text-slate-600">{campaign.helper}</p>

        <div className="mt-auto grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-slate-900 p-4 text-white">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-300">{campaign.primaryMetricLabel}</p>
            <p className="mt-1 text-lg font-black">{campaign.primaryMetricValue}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{campaign.secondaryMetricLabel}</p>
            <p className="mt-1 text-lg font-black text-slate-950">{campaign.secondaryMetricValue}</p>
          </div>
        </div>

        <Link
          href="/pwnit-2"
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-center text-sm font-black text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800"
        >
          View lifecycle rules
        </Link>
      </div>
    </article>
  );
}
