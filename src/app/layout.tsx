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
        <div className="mx-auto max-w-[1840px] px-3 py-2 sm:px-4 lg:px-5">
          <header className="mb-2 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href="/" className="inline-block leading-none">
                  <span className="text-[20px] font-semibold text-slate-700 sm:text-[24px]">Pick. Play.</span>{" "}
                  <span className="text-[32px] font-black text-blue-600 sm:text-[36px]">PwnIt.</span>
                </Link>

                <div className="mt-2">
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

          <footer className="mt-2 rounded-3xl border border-slate-200 bg-white px-4 py-2 shadow-sm sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
              <div className="min-w-0">
                <span className="font-semibold uppercase tracking-wide text-slate-500">Contact:</span>{" "}
                <span className="text-slate-600">WhatsApp: +27 82 123 4567 · Email: hello@pwnit.co.za</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 font-medium">
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
