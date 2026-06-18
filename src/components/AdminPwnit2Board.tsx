"use client";

import { useCallback, useEffect, useState } from "react";

type Round = {
  id: string;
  sequence: number;
  state: string;
  attemptCount: number;
  paidCreditsCollected: number;
  freeCreditsCollected: number;
  activationTargetCredits: number;
  closesAt?: string | null;
  purchaseGraceEndsAt?: string | null;
  winnerUserId?: string | null;
  winningScore?: number | null;
  statusReason?: string | null;
  allowedTargets: string[];
  archivable: boolean;
  cancellable: boolean;
};

type ItemRow = {
  id: string;
  title: string;
  state: string;
  prizeValueZAR: number;
  playCostCredits: number;
  activationGoalEntries: number;
  rounds: Round[];
};

const ACTION_LABELS: Record<string, string> = {
  publish_draft: "Publish (start funding)",
  activate: "Activate (start countdown)",
  close: "Close (lock winner)",
  publish_results: "Publish results",
  open_purchase_window: "Open/extend buy window",
  expire: "Expire (expire discounts)",
  archive: "Archive (snapshot + freeze)",
  cancel: "Cancel (refund)",
  start_next_round: "Start next round",
};

function actionsForRound(r: Round): string[] {
  const out: string[] = [];
  if (r.state === "DRAFT") out.push("publish_draft");
  if (r.allowedTargets.includes("ACTIVATED")) out.push("activate");
  if (r.allowedTargets.includes("CLOSED")) out.push("close");
  if (r.state === "REVIEW") out.push("publish_results");
  if (["CLOSED", "REVIEW", "PUBLISHED"].includes(r.state)) out.push("open_purchase_window");
  if (r.allowedTargets.includes("EXPIRED")) out.push("expire");
  if (r.archivable) out.push("archive");
  if (r.cancellable) out.push("cancel");
  if (r.state === "PUBLISHED") out.push("start_next_round");
  return out;
}

function chipTone(state: string) {
  if (state === "ACTIVATED") return "bg-emerald-100 text-emerald-800";
  if (state === "BUILDING") return "bg-amber-100 text-amber-800";
  if (state === "DRAFT") return "bg-slate-200 text-slate-700";
  if (["EXPIRED", "CANCELLED", "ARCHIVED", "FAILED", "REFUNDED"].includes(state)) return "bg-rose-100 text-rose-800";
  return "bg-sky-100 text-sky-800";
}

async function getJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

export default function AdminPwnit2Board() {
  const [tab, setTab] = useState<"campaigns" | "ledgers" | "audit" | "archived">("campaigns");
  const [items, setItems] = useState<ItemRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadCampaigns = useCallback(async () => {
    try {
      const data = await getJson("/api/admin/campaigns");
      setItems(data.items ?? []);
    } catch (error: any) {
      setNotice(error.message);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  async function runAction(round: Round, action: string) {
    const needsReason = action === "cancel";
    const reason = needsReason
      ? window.prompt("Reason (required for cancel):") ?? ""
      : window.prompt("Optional note/reason (Cancel = none):") ?? "";
    if (needsReason && !reason.trim()) {
      setNotice("Cancelled: a reason is required.");
      return;
    }
    let hours: number | undefined;
    if (action === "open_purchase_window") {
      const h = window.prompt("Buy window length in hours:", "24") ?? "";
      hours = Math.max(1, Math.floor(Number(h) || 24));
    }
    if (!window.confirm(`${ACTION_LABELS[action] ?? action} — round ${round.sequence}. Continue?`)) return;
    setBusy(true);
    setNotice(null);
    try {
      const result = await postJson("/api/admin/campaigns/action", { action, roundId: round.id, reason, hours });
      setNotice(`Done: ${action} -> ${result.state ?? "ok"}`);
      await loadCampaigns();
    } catch (error: any) {
      setNotice(`Error: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function createDraft(form: FormData) {
    setBusy(true);
    setNotice(null);
    try {
      await postJson("/api/admin/campaigns/action", {
        action: "create_draft",
        title: String(form.get("title") ?? ""),
        prizeValueZAR: Number(form.get("value") ?? 0),
        playCostCredits: Number(form.get("playCost") ?? 5),
        activationGoalEntries: Number(form.get("entries") ?? 20),
        imageUrl: String(form.get("imageUrl") ?? ""),
      });
      setNotice("Draft campaign created.");
      await loadCampaigns();
    } catch (error: any) {
      setNotice(`Error: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {(["campaigns", "ledgers", "audit", "archived"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-black capitalize transition ${
              tab === t ? "bg-[#0f172a] text-white" : "border border-[#e6ded9] bg-white text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {notice ? (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-900">{notice}</div>
      ) : null}

      {tab === "campaigns" ? (
        <div className="space-y-4">
          <details className="rounded-2xl border border-[#e6ded9] bg-white p-4">
            <summary className="cursor-pointer text-sm font-black text-slate-900">+ Create draft campaign</summary>
            <form
              className="mt-3 grid gap-2 sm:grid-cols-5"
              onSubmit={(e) => {
                e.preventDefault();
                createDraft(new FormData(e.currentTarget));
              }}
            >
              <input name="title" placeholder="Title" required className="rounded-xl border border-[#e6ded9] px-3 py-2 text-sm sm:col-span-2" />
              <input name="value" type="number" placeholder="Value (R)" required className="rounded-xl border border-[#e6ded9] px-3 py-2 text-sm" />
              <input name="playCost" type="number" placeholder="Play cost" defaultValue={5} className="rounded-xl border border-[#e6ded9] px-3 py-2 text-sm" />
              <input name="entries" type="number" placeholder="Activation entries" defaultValue={20} className="rounded-xl border border-[#e6ded9] px-3 py-2 text-sm" />
              <input name="imageUrl" placeholder="Image URL (optional, e.g. /vouchers/hero.svg)" className="rounded-xl border border-[#e6ded9] px-3 py-2 text-sm sm:col-span-5" />
              <button disabled={busy} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white sm:col-span-5">
                Create draft
              </button>
            </form>
          </details>

          {items.map((item) => (
            <div key={item.id} className="rounded-3xl border border-[#e6ded9] bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-base font-black text-slate-950">{item.title}</h2>
                <span className="text-xs font-bold text-slate-500">
                  R{item.prizeValueZAR} · R{item.playCostCredits}/play · {item.activationGoalEntries} entries
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {item.rounds.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-[#f0e9e4] p-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${chipTone(r.state)}`}>{r.state}</span>
                      <span className="font-bold text-slate-700">Round {r.sequence}</span>
                      <span className="text-xs font-semibold text-slate-500">
                        {r.attemptCount} attempts · R{r.paidCreditsCollected} paid / R{r.freeCreditsCollected} free of R{r.activationTargetCredits}
                      </span>
                      {r.winnerUserId ? (
                        <span className="text-xs font-bold text-emerald-700">winner locked{r.winningScore != null ? ` · ${r.winningScore}` : ""}</span>
                      ) : null}
                    </div>
                    {r.statusReason ? <p className="mt-1 text-xs font-semibold text-slate-500">Note: {r.statusReason}</p> : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {actionsForRound(r).map((a) => (
                        <button
                          key={a}
                          disabled={busy}
                          onClick={() => runAction(r, a)}
                          className={`rounded-full px-3 py-1.5 text-xs font-black transition disabled:opacity-50 ${
                            a === "cancel" || a === "expire"
                              ? "border border-rose-200 bg-rose-50 text-rose-800"
                              : "border border-emerald-200 bg-emerald-50 text-emerald-800"
                          }`}
                        >
                          {ACTION_LABELS[a]}
                        </button>
                      ))}
                      {actionsForRound(r).length === 0 ? (
                        <span className="text-xs font-semibold text-slate-400">No actions (terminal state)</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "ledgers" ? <LedgersTab busy={busy} setBusy={setBusy} setNotice={setNotice} /> : null}
      {tab === "audit" ? <AuditTab /> : null}
      {tab === "archived" ? <ArchivedTab setNotice={setNotice} /> : null}
    </div>
  );
}

function LedgersTab({ busy, setBusy, setNotice }: { busy: boolean; setBusy: (b: boolean) => void; setNotice: (s: string | null) => void }) {
  const [ledger, setLedger] = useState<"credit" | "discount">("credit");
  const [user, setUser] = useState("");
  const [kind, setKind] = useState("");
  const [rows, setRows] = useState<any[]>([]);

  async function search() {
    try {
      const params = new URLSearchParams({ ledger });
      if (user.trim()) params.set("user", user.trim());
      if (kind.trim()) params.set("kind", kind.trim());
      const data = await getJson(`/api/admin/ledger?${params.toString()}`);
      setRows(data.rows ?? []);
    } catch (error: any) {
      setNotice(`Error: ${error.message}`);
    }
  }

  async function adjust(form: FormData, kindSel: "credit" | "discount") {
    setBusy(true);
    setNotice(null);
    try {
      const payload: any = {
        kind: kindSel,
        user: String(form.get("user") ?? ""),
        reason: String(form.get("reason") ?? ""),
      };
      if (kindSel === "credit") payload.deltaCredits = Number(form.get("delta") ?? 0);
      else {
        payload.deltaZAR = Number(form.get("delta") ?? 0);
        payload.itemId = String(form.get("itemId") ?? "");
        payload.roundId = String(form.get("roundId") ?? "") || null;
      }
      const result = await postJson("/api/admin/adjust", payload);
      setNotice(`Adjusted ${result.user}.`);
    } catch (error: any) {
      setNotice(`Error: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-[#e6ded9] bg-white p-4">
        <select value={ledger} onChange={(e) => setLedger(e.target.value as any)} className="rounded-xl border border-[#e6ded9] px-3 py-2 text-sm">
          <option value="credit">Credit ledger</option>
          <option value="discount">Discount ledger</option>
        </select>
        <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="User email (optional)" className="rounded-xl border border-[#e6ded9] px-3 py-2 text-sm" />
        <input value={kind} onChange={(e) => setKind(e.target.value)} placeholder="Kind/type (optional)" className="rounded-xl border border-[#e6ded9] px-3 py-2 text-sm" />
        <button onClick={search} className="rounded-xl bg-[#0f172a] px-4 py-2 text-sm font-black text-white">Search</button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#e6ded9] bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#fffaf3] font-black uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Kind</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Balance after</th>
              <th className="px-3 py-2">Source / note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-[#f0e9e4] font-semibold text-slate-700">
                <td className="px-3 py-2 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="px-3 py-2">{r.user?.email ?? r.userId}</td>
                <td className="px-3 py-2">{r.kind ?? r.type}</td>
                <td className="px-3 py-2">{r.credits ?? r.amount}</td>
                <td className="px-3 py-2">{r.balanceAfter ?? ""}</td>
                <td className="px-3 py-2">{[r.source, r.note].filter(Boolean).join(" · ")}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center font-semibold text-slate-400">No rows — run a search.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <form
          className="space-y-2 rounded-2xl border border-[#e6ded9] bg-white p-4"
          onSubmit={(e) => {
            e.preventDefault();
            adjust(new FormData(e.currentTarget), "credit");
          }}
        >
          <h3 className="text-sm font-black text-slate-900">Adjust credits (reason required)</h3>
          <input name="user" placeholder="User email" required className="w-full rounded-xl border border-[#e6ded9] px-3 py-2 text-sm" />
          <input name="delta" type="number" placeholder="Delta (e.g. 50 or -50)" required className="w-full rounded-xl border border-[#e6ded9] px-3 py-2 text-sm" />
          <input name="reason" placeholder="Reason" required className="w-full rounded-xl border border-[#e6ded9] px-3 py-2 text-sm" />
          <button disabled={busy} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white">Apply</button>
        </form>
        <form
          className="space-y-2 rounded-2xl border border-[#e6ded9] bg-white p-4"
          onSubmit={(e) => {
            e.preventDefault();
            adjust(new FormData(e.currentTarget), "discount");
          }}
        >
          <h3 className="text-sm font-black text-slate-900">Adjust campaign discount (reason required)</h3>
          <input name="user" placeholder="User email" required className="w-full rounded-xl border border-[#e6ded9] px-3 py-2 text-sm" />
          <input name="itemId" placeholder="Item ID" required className="w-full rounded-xl border border-[#e6ded9] px-3 py-2 text-sm" />
          <input name="roundId" placeholder="Round ID (optional)" className="w-full rounded-xl border border-[#e6ded9] px-3 py-2 text-sm" />
          <input name="delta" type="number" placeholder="Delta R (e.g. 25 or -25)" required className="w-full rounded-xl border border-[#e6ded9] px-3 py-2 text-sm" />
          <input name="reason" placeholder="Reason" required className="w-full rounded-xl border border-[#e6ded9] px-3 py-2 text-sm" />
          <button disabled={busy} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white">Apply</button>
        </form>
      </div>
    </div>
  );
}

function AuditTab() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    getJson("/api/admin/audit?limit=100")
      .then((d) => setRows(d.rows ?? []))
      .catch(() => setRows([]));
  }, []);
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <details key={r.id} className="rounded-2xl border border-[#e6ded9] bg-white p-3 text-sm">
          <summary className="cursor-pointer font-bold text-slate-800">
            {new Date(r.createdAt).toLocaleString()} · {r.action} · {r.entityType} {String(r.entityId).slice(0, 8)}
            {r.reason ? ` · ${r.reason}` : ""}
          </summary>
          <pre className="mt-2 overflow-x-auto rounded-xl bg-[#fffaf3] p-3 text-xs">
            {JSON.stringify({ before: safeParse(r.beforeJson), after: safeParse(r.afterJson), admin: r.adminUserId, ip: r.ipAddress }, null, 2)}
          </pre>
        </details>
      ))}
      {rows.length === 0 ? <p className="text-sm font-semibold text-slate-400">No audit rows yet.</p> : null}
    </div>
  );
}

function ArchivedTab({ setNotice }: { setNotice: (s: string | null) => void }) {
  const [snaps, setSnaps] = useState<any[]>([]);
  const load = useCallback(() => {
    getJson("/api/admin/audit?view=snapshots")
      .then((d) => setSnaps(d.snapshots ?? []))
      .catch(() => setSnaps([]));
  }, []);
  useEffect(load, [load]);

  async function editNotes(s: any) {
    const notes = window.prompt("Internal notes for this archived campaign:", s.notes ?? "") ?? null;
    if (notes === null) return;
    try {
      await postJson("/api/admin/campaigns/action", { action: "snapshot_notes", snapshotId: s.id, notes });
      setNotice("Notes saved.");
      load();
    } catch (error: any) {
      setNotice(`Error: ${error.message}`);
    }
  }

  return (
    <div className="space-y-3">
      {snaps.map((s) => {
        const lb = safeParse(s.finalLeaderboardJson) ?? [];
        return (
          <details key={s.id} className="rounded-2xl border border-[#e6ded9] bg-white p-4 text-sm">
            <summary className="cursor-pointer font-black text-slate-900">
              {s.item?.title ?? s.itemId} · {s.finalStatus} · archived {new Date(s.archivedAt).toLocaleString()}
            </summary>
            <div className="mt-3 grid gap-1 text-xs font-semibold text-slate-700 sm:grid-cols-2">
              <span>Final value: R{s.finalVoucherValueZAR}</span>
              <span>Winner: {s.winnerUserId ? `${String(s.winnerUserId).slice(0, 8)} · score ${s.winningScore ?? "-"}` : "none"}</span>
              <span>Paid spent: R{s.totalPaidCreditsSpent} · Free: R{s.totalFreeCreditsSpent}</span>
              <span>Discount earned R{s.totalDiscountEarned} · redeemed R{s.totalDiscountRedeemed} · expired R{s.totalDiscountExpired}</span>
              <span>Purchases: {s.totalPurchases}</span>
              <span>Archived by: {String(s.archivedByUserId).slice(0, 8)}</span>
            </div>
            {Array.isArray(lb) && lb.length ? (
              <ol className="mt-3 space-y-1 text-xs font-semibold text-slate-600">
                {lb.slice(0, 10).map((row: any) => (
                  <li key={row.rank}>#{row.rank} {row.alias} — {row.score}</li>
                ))}
              </ol>
            ) : null}
            <p className="mt-3 text-xs font-semibold text-slate-500">Notes: {s.notes ?? "—"}</p>
            <button onClick={() => editNotes(s)} className="mt-2 rounded-full border border-[#e6ded9] bg-white px-3 py-1.5 text-xs font-black text-slate-700">
              Edit notes
            </button>
          </details>
        );
      })}
      {snaps.length === 0 ? <p className="text-sm font-semibold text-slate-400">No archived campaigns yet.</p> : null}
    </div>
  );
}

function safeParse(text: string | null | undefined) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
