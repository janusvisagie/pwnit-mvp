import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function Admin() {
  const items = await prisma.item.findMany({ orderBy: [{ tier:"asc" }, { createdAt:"asc" }]});
  return (
    <main>
      <h1 style={{ marginTop: 0 }}>Admin (pilot)</h1>
      <p style={{ marginTop: 0, color:"#555" }}>
        Read-only list. Add CRUD endpoints when ready.
      </p>

      <div style={{ display:"grid", gap: 10 }}>
        {items.map(i => (
          <div key={i.id} style={{ border:"1px solid #eee", borderRadius: 14, padding: 12 }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <b>{i.title}</b>
              <span>{i.state}</span>
            </div>
            <div style={{ color:"#666", fontSize: 12 }}>
              Goal: {i.activationGoalEntries} • Countdown: {i.countdownMinutes}m • Tier: {i.tier}
            </div>
            <div style={{ marginTop: 8 }}>
              <Link href={`/item/${i.id}`} style={{ fontSize: 13, color:"#111" }}>Open</Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
