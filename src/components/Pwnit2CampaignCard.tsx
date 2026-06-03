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
  tertiaryMetricLabel?: string;
  tertiaryMetricValue?: string;
};

const toneClasses: Record<Pwnit2CampaignCardModel["statusTone"], string> = {
  funding: "border-[#f3c2b1] bg-[#fff4ef] text-[#9f5a46]",
  countdown: "border-[#88d7d0] bg-[#effdfb] text-[#0f766e]",
  closed: "border-slate-300 bg-slate-50 text-slate-700",
};

export default function Pwnit2CampaignCard({ campaign }: { campaign: Pwnit2CampaignCardModel }) {
  const pct = Math.max(0, Math.min(100, Math.round(campaign.activationPct || 0)));

  return (
    <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-[#0f766e] p-6 text-white sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#8de3dd]">{campaign.category}</p>
          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${toneClasses[campaign.statusTone]}`}>
            {campaign.statusLabel}
          </span>
        </div>

        <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">{campaign.title}</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200">{campaign.helper}</p>
      </div>

      <div className="space-y-6 p-6 sm:p-7">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#f5d7cc] bg-[#fff7f2] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b86b56]">Base value</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{campaign.baseValueLabel}</p>
          </div>
          <div className="rounded-2xl border border-[#aee9e3] bg-[#f0fdfa] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0f766e]">Current value</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{campaign.currentValueLabel}</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 text-sm font-bold text-slate-700">
            <span>Activation progress</span>
            <span>{pct}%</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#14b8a6] via-[#5eead4] to-[#ef8f75]"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <dl className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{campaign.primaryMetricLabel}</dt>
            <dd className="mt-1 text-xl font-black text-slate-950">{campaign.primaryMetricValue}</dd>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{campaign.secondaryMetricLabel}</dt>
            <dd className="mt-1 text-xl font-black text-slate-950">{campaign.secondaryMetricValue}</dd>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              {campaign.tertiaryMetricLabel ?? "Workflow"}
            </dt>
            <dd className="mt-1 text-xl font-black text-slate-950">{campaign.tertiaryMetricValue ?? "Demo"}</dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/pwnit-2"
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            View rules
          </Link>
          <Link
            href="/buy-credits"
            className="rounded-full border border-[#ef8f75] bg-[#fff7f2] px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-[#ffe6dc]"
          >
            Credits status
          </Link>
        </div>
      </div>
    </article>
  );
}
