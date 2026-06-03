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
  gameHref?: string;
  leaderboardHref?: string;
};

const toneClasses: Record<Pwnit2CampaignCardModel["statusTone"], string> = {
  funding: "border-[#ffd0c4] bg-[#fff7f4] text-[#a64f3d]",
  countdown: "border-[#8bd7d0] bg-[#effdfb] text-[#10645c]",
  closed: "border-slate-300 bg-slate-50 text-slate-700",
};

export default function Pwnit2CampaignCard({ campaign }: { campaign: Pwnit2CampaignCardModel }) {
  const pct = Math.max(0, Math.min(100, Math.round(campaign.activationPct || 0)));

  return (
    <article className="overflow-hidden rounded-[2rem] border border-[#f0d9d1] bg-white shadow-sm shadow-slate-200/70">
      <div className="bg-gradient-to-br from-[#101828] via-[#12324a] to-[#116466] px-5 py-5 text-white sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#b7f2ec]">{campaign.category}</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{campaign.title}</h2>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${toneClasses[campaign.statusTone]}`}>
            {campaign.statusLabel}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Base value</p>
            <p className="mt-1 text-2xl font-black">{campaign.baseValueLabel}</p>
          </div>
          <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Current value</p>
            <p className="mt-1 text-2xl font-black">{campaign.currentValueLabel}</p>
          </div>
          <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Activation</p>
            <p className="mt-1 text-2xl font-black">{pct}%</p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div>
          <div className="h-3 overflow-hidden rounded-full bg-[#f3e5df]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#14b8a6] via-[#6fd3c7] to-[#f6a892]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{campaign.helper}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label={campaign.primaryMetricLabel} value={campaign.primaryMetricValue} />
          <Metric label={campaign.secondaryMetricLabel} value={campaign.secondaryMetricValue} />
          <Metric label={campaign.tertiaryMetricLabel ?? "Status"} value={campaign.tertiaryMetricValue ?? "Active"} />
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href={campaign.gameHref ?? "/play/pwnit-2"}
            className="rounded-full bg-[#0f172a] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#172554]"
          >
            Play skill game
          </Link>
          <Link
            href={campaign.leaderboardHref ?? "/pwnit-2/leaderboard"}
            className="rounded-full border border-[#8bd7d0] bg-[#effdfb] px-5 py-3 text-sm font-black text-[#10645c] transition hover:-translate-y-0.5 hover:bg-white"
          >
            View leaderboard
          </Link>
          <Link
            href="/buy-credits"
            className="rounded-full border border-[#f2c2b5] bg-[#fff7f4] px-5 py-3 text-sm font-black text-[#9f4d3d] transition hover:-translate-y-0.5 hover:bg-white"
          >
            Credits
          </Link>
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#f0d9d1] bg-[#fffaf8] p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}
