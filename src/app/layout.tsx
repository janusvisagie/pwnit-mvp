import type { Metadata } from "next";
import Link from "next/link";

import "./globals.css";
import { AuthStatusShell } from "@/components/AuthStatusShell";
import { CreditsPill } from "@/components/CreditsPill";
import HeaderNav from "@/components/HeaderNav";

export const metadata: Metadata = {
  title: "PwnIt",
  description: "Pick. Play. PwnIt.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 text-slate-900">
        <div className="mx-auto max-w-[1840px] px-3 py-1.5 sm:px-4 lg:px-5">
          <header className="mb-1.5 rounded-3xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm sm:px-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <Link href="/" className="inline-block leading-none">
                  <span className="text-[20px] font-semibold text-slate-700 sm:text-[24px]">Pick. Play.</span>{" "}
                  <span className="text-[32px] font-black text-blue-600 sm:text-[36px]">PwnIt.</span>
                </Link>

                <div className="mt-1.5">
                  <HeaderNav />
                </div>
              </div>

              <div className="ml-auto flex flex-wrap items-center gap-2">
                <CreditsPill />
                <AuthStatusShell />
              </div>
            </div>
          </header>

          {children}

          <footer className="mt-1 rounded-3xl border border-slate-200 bg-white px-4 py-1.5 shadow-sm sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs leading-tight">
              <div className="min-w-0 text-slate-600">
                <span className="font-semibold uppercase tracking-wide text-slate-500">Contact:</span>{" "}
                WhatsApp: +27 82 123 4567 · Email: hello@pwnit.co.za
              </div>

              <div className="flex flex-wrap items-center gap-2.5 font-medium">
                <Link href="/how-activation-works" className="text-slate-700 hover:text-slate-950">
                  How it works
                </Link>
                <Link href="/terms" className="text-slate-700 hover:text-slate-950">
                  Terms
                </Link>
                <Link href="/feedback" className="text-slate-700 hover:text-slate-950">
                  Feedback
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
