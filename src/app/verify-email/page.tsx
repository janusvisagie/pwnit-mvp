import VerifyEmailClient from "./VerifyEmailClient";

export const dynamic = "force-dynamic";

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <VerifyEmailClient />
    </main>
  );
}
