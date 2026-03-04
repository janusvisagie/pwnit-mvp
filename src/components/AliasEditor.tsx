// src/components/AliasEditor.tsx
"use client";

import { useState } from "react";

export function AliasEditor({ initialAlias }: { initialAlias: string }) {
  const [alias, setAlias] = useState(initialAlias || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/me/alias", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ alias }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error || "Failed");
      setMsg("Saved");
    } catch (e: any) {
      setMsg(e?.message || "Error");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 1500);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-sm font-extrabold text-slate-900">Your leaderboard name</div>
      <div className="mt-2 flex gap-2">
        <input
          value={alias}
          onChange={(e) => setAlias(e.target.value.slice(0, 24))}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900/10"
          placeholder="e.g. PwnIt_0000"
        />
        <button
          onClick={save}
          disabled={saving}
          className={[
            "shrink-0 rounded-xl px-4 py-2 text-sm font-extrabold",
            saving ? "bg-slate-200 text-slate-500" : "bg-slate-900 text-white hover:bg-slate-800",
          ].join(" ")}
        >
          Save
        </button>
      </div>
      {msg ? <div className="mt-2 text-xs font-semibold text-slate-600">{msg}</div> : null}
    </div>
  );
}
