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
        <div className="mx-auto max-w-[1840px] px-3 py-1 sm:px-4 lg:px-5">
          <header className="mb-1 rounded-3xl border border-slate-200 bg-white px-4 py-2 shadow-sm sm:px-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <Link href="/" className="inline-block leading-none">
                  <span className="text-[18px] font-semibold text-slate-700 sm:text-[22px]">Pick. Play.</span>{" "}
                  <span className="text-[28px] font-black text-blue-600 sm:text-[32px]">PwnIt.</span>
                </Link>

                <div className="mt-1 origin-left scale-95">
                  <HeaderNav />
                </div>
              </div>

              <div className="ml-auto flex origin-top-right scale-90 flex-wrap items-center gap-1.5">
                <CreditsPill />
                <AuthStatusShell />
              </div>
            </div>
          </header>

          {children}

          <footer className="mt-1 rounded-3xl border border-slate-200 bg-white px-4 py-1.5 shadow-sm sm:px-5">
            <div className="text-[10px] leading-tight text-slate-600 sm:text-xs">
              <span className="font-semibold uppercase tracking-wide text-slate-500">Contact:</span>{" "}
              WhatsApp: +27 82 123 4567 · Email: hello@pwnit.co.za
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
