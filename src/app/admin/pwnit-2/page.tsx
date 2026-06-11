export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import AdminPwnit2Board from "@/components/AdminPwnit2Board";
import { isCurrentUserAdmin } from "@/lib/admin";

export const metadata = { title: "Campaign admin · PwnIt" };

export default async function AdminPwnit2Page() {
  const admin = await isCurrentUserAdmin();
  if (!admin) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-black text-slate-950">403 — admin only</h1>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Sign in with an admin account. Admins are configured via the ADMIN_EMAILS environment variable
          (set it locally in .env.local and on Vercel).
        </p>
      </main>
    );
  }
  return (
    <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-slate-950">Campaign admin</h1>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Lifecycle controls, audit ledgers, and archived campaign snapshots. Every action here is
            verified server-side and written to the admin audit log.
          </p>
        </div>
        <Link href="/admin" className="text-sm font-black text-emerald-700 underline-offset-2 hover:underline">
          Review queue →
        </Link>
      </div>
      <AdminPwnit2Board />
    </main>
  );
}
