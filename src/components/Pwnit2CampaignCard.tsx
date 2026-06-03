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
  funding: "border-[#d8b99d] bg-[#fbf1e4] text-[#8b5a36]",
  countdown: "border-[#a9c3b1] bg-[#eef6ef] text-[#4f765e]",
  closed: "border-[#c8b8ae] bg-[#f7f1ed] text-[#745f55]",
};

export default function Pwnit2CampaignCard({ campaign }: { campaign: Pwnit2CampaignCardModel }) {
  const pct = Math.max(0, Math.min(100, Math.round(campaign.activationPct || 0)));

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-[#e5d8ca] bg-[#fffaf3] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#f4e3d1] via-[#fffaf3] to-[#e7efe8] p-5">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#d9a77d]/30 blur-2xl" />
        <div className="absolute -bottom-10 left-8 h-24 w-24 rounded-full bg-[#94afa0]/25 blur-2xl" />

        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#867363]">{campaign.category}</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{campaign.title}</h3>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${toneClasses[campaign.statusTone]}`}>
            {campaign.statusLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#e5d8ca] bg-[#fbf3ea] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#806b5b]">Base value</p>
            <p className="mt-1 text-xl font-black text-slate-950">{campaign.baseValueLabel}</p>
          </div>
          <div className="rounded-2xl border border-[#e5d8ca] bg-[#fbf3ea] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#806b5b]">Current value</p>
            <p className="mt-1 text-xl font-black text-slate-950">{campaign.currentValueLabel}</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm font-bold text-[#705f53]">
            <span>Activation</span>
            <span>{pct}%</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#eadfd1] ring-1 ring-[#ddcdbb]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#c98d63] via-[#d8b99d] to-[#8eaa98]" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <p className="text-sm leading-6 text-[#66584d]">{campaign.helper}</p>

        <div className="mt-auto grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
          <div className="rounded-2xl bg-[#2f3a32] p-4 text-white">
            <p className="text-xs font-bold uppercase tracking-wide text-[#d8d0c6]">{campaign.primaryMetricLabel}</p>
            <p className="mt-1 text-lg font-black">{campaign.primaryMetricValue}</p>
          </div>
          <div className="rounded-2xl border border-[#e5d8ca] bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#806b5b]">{campaign.secondaryMetricLabel}</p>
            <p className="mt-1 text-lg font-black text-slate-950">{campaign.secondaryMetricValue}</p>
          </div>
          <div className="rounded-2xl border border-[#d9c7b4] bg-[#fbf3ea] p-4 md:block">
            <p className="text-xs font-bold uppercase tracking-wide text-[#806b5b]">{campaign.tertiaryMetricLabel ?? "Purchases"}</p>
            <p className="mt-1 text-lg font-black text-slate-950">{campaign.tertiaryMetricValue ?? "Planned"}</p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Link
            href="/pwnit-2"
            className="rounded-full border border-[#cdbba7] bg-white px-4 py-2 text-center text-sm font-black text-[#5f5047] transition hover:border-[#b89572] hover:bg-[#fbf3ea]"
          >
            View rules
          </Link>
          <Link
            href="/buy-credits"
            className="rounded-full bg-[#2f3a32] px-4 py-2 text-center text-sm font-black text-white transition hover:bg-[#3f4d43]"
          >
            Credits status
          </Link>
        </div>
      </div>
    </article>
  );
}
