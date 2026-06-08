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
  statusHref?: string;

  // extended (optional)
  slug?: string;
  state?: "FUNDING" | "COUNTDOWN" | "STATUS_WINDOW" | "ARCHIVED";
  baseValueZAR?: number;
  currentValueZAR?: number;
  growthZAR?: number;
  yourDiscountZAR?: number;
  isWinnerYou?: boolean;
};

const toneClasses: Record<Pwnit2CampaignCardModel["statusTone"], string> = {
  funding: "border-slate-200 bg-slate-50 text-slate-700",
  countdown: "border-emerald-300 bg-emerald-50 text-emerald-700",
  closed: "border-slate-300 bg-slate-100 text-slate-700",
};

export default function Pwnit2CampaignCard({ campaign }: { campaign: Pwnit2CampaignCardModel }) {
  const pct = Math.max(0, Math.min(100, Math.round(campaign.activationPct || 0)));
  const growth = campaign.growthZAR ?? 0;
  const yourDiscount = campaign.yourDiscountZAR ?? 0;
  const inBuyWindow = campaign.state === "STATUS_WINDOW";
  const q = campaign.slug ? `?item=${campaign.slug}` : "";
  const gameHref = campaign.gameHref ?? `/play/pwnit-2${q}`;
  const leaderboardHref = campaign.leaderboardHref ?? `/pwnit-2/leaderboard${q}`;
  const statusHref = campaign.statusHref ?? `/pwnit-2/status${q}`;
  const purchaseHref = `/pwnit-2/purchase${q}`;

  return (
    <article className="overflow-hidden rounded-[2rem] border border-[#e6ded9] bg-white shadow-sm shadow-slate-200/70">
      <div className="bg-gradient-to-br from-[#0f172a] via-[#12324a] to-[#116466] px-5 py-5 text-white sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">{campaign.category}</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{campaign.title}</h2>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${toneClasses[campaign.statusTone]}`}>
            {campaign.statusLabel}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <HeroMetric label="Base value" value={campaign.baseValueLabel} />
          <HeroMetric label="Current value" value={campaign.currentValueLabel} note={growth > 0 ? `+R${growth} grown` : undefined} />
          <HeroMetric label="Activation" value={`${pct}%`} />
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div>
          <div className="h-3 overflow-hidden rounded-full bg-[#e8efe9]">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-400 to-teal-400" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{campaign.helper}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label={campaign.primaryMetricLabel} value={campaign.primaryMetricValue} />
          <Metric label={campaign.secondaryMetricLabel} value={campaign.secondaryMetricValue} />
          <Metric label="Your discount" value={`R${yourDiscount}`} highlight />
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <Link href={gameHref} className="rounded-full bg-[#0f172a] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#172554]">
            Play memory game
          </Link>
          {inBuyWindow ? (
            <Link href={purchaseHref} className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-700">
              Buy the voucher
            </Link>
          ) : (
            <Link href={leaderboardHref} className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-800 transition hover:-translate-y-0.5 hover:bg-white">
              View leaderboard
            </Link>
          )}
          <Link href={statusHref} className="rounded-full border border-[#e6ded9] bg-[#fffaf8] px-5 py-3 text-sm font-black text-slate-700 transition hover:-translate-y-0.5 hover:bg-white">
            Campaign status
          </Link>
        </div>
      </div>
    </article>
  );
}

function HeroMetric({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
      {note ? <p className="mt-0.5 text-xs font-bold text-emerald-200">{note}</p> : null}
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={["rounded-2xl border p-4", highlight ? "border-emerald-200 bg-emerald-50" : "border-[#e6ded9] bg-[#fffaf8]"].join(" ")}>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-black ${highlight ? "text-emerald-700" : "text-slate-950"}`}>{value}</p>
    </div>
  );
}
