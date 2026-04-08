export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";

import { parseAttemptFlags } from "@/lib/botRisk";
import { prisma } from "@/lib/db";

export default async function Admin() {
  noStore();
  try {
    const [items, reviewRounds] = await Promise.all([
      prisma.item.findMany({ orderBy: [{ tier: "asc" }, { createdAt: "asc" }] }),
      prisma.itemRound.findMany({
      where: { state: "REVIEW" },
      include: {
        item: true,
        attempts: {
          orderBy: [{ createdAt: "asc" }],
          include: {
            user: {
              select: { alias: true, email: true },
            },
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
    }),
  ]);

    return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-black text-slate-950">Admin (pilot)</h1>
        <p className="mt-2 text-sm text-slate-600">Read-only operational view with security review visibility.</p>
      </div>

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-lg font-black text-amber-950">Rounds awaiting winner review</h2>
        <p className="mt-2 text-sm text-amber-900">
          When a podium candidate has low bot score, poor interaction quality, or superhuman telemetry, automatic publishing is paused.
        </p>

        <div className="mt-4 space-y-4">
          {reviewRounds.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-700">No rounds are currently awaiting review.</div>
          ) : (
            reviewRounds.map((round) => {
              const flagged = round.attempts
                .map((attempt) => ({ attempt, flags: parseAttemptFlags(attempt.flags) }))
                .filter((entry) => entry.flags?.risk?.reviewRequired)
                .sort((a, b) => a.attempt.scoreMs - b.attempt.scoreMs)
                .slice(0, 3);

              return (
                <div key={round.id} className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">{round.item.title}</div>
                      <div className="mt-1 text-lg font-black text-slate-950">Round in review</div>
                    </div>
                    <Link href={`/item/${round.itemId}`} className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900">
                      Open item
                    </Link>
                  </div>

                  <div className="mt-4 space-y-3">
                    {flagged.length === 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        This round is in review, but no flagged finalist payload could be parsed from current attempt flags.
                      </div>
                    ) : (
                      flagged.map(({ attempt, flags }, index) => (
                        <div key={attempt.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
                          <div className="font-semibold text-slate-950">Candidate #{index + 1}: {attempt.user.alias || attempt.user.email}</div>
                          <div className="mt-1">Score: {attempt.scoreMs.toLocaleString("en-ZA")}</div>
                          <div className="mt-1">Reasons: {(flags?.risk?.reasons || []).join(", ") || "Review required"}</div>
                          <div className="mt-1 text-slate-600">
                            Interaction score: {flags?.risk?.interactionScore ?? "—"} • reCAPTCHA: {flags?.risk?.recaptcha?.score ?? "—"} • Cloudflare bot score: {flags?.risk?.cfBotScore ?? "—"}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-950">Items</h2>
        <p className="mt-2 text-sm text-slate-600">Read-only list. Add CRUD endpoints when ready.</p>
        <div className="mt-4 space-y-3">
          {items.map((i) => (
            <div key={i.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-950">{i.title}</div>
                  <div className="mt-1 text-sm text-slate-600">Goal: {i.activationGoalEntries} • Countdown: {i.countdownMinutes}m • Tier: {i.tier} • State: {i.state}</div>
                </div>
                <Link href={`/item/${i.id}`} className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900">
                  Open
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
  } catch {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
          <h1 className="text-2xl font-black">Admin (pilot)</h1>
          <p className="mt-2 text-sm">The admin view could not load right now because the database is unavailable.</p>
        </div>
      </div>
    );
  }
}