import type { Metadata } from "next";
import Link from "next/link";

import { AuthStatusShell } from "@/components/AuthStatusShell";
import HeaderNav from "@/components/HeaderNav";

import "./globals.css";

export const metadata: Metadata = {
  title: "PwnIt 2.0",
  description: "Skill-first campaigns that activate before they close.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 text-slate-950 antialiased">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 py-3 sm:px-4 sm:py-4">
          <header className="mb-3 rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link href="/" className="group flex items-center gap-2">
                  <span className="rounded-2xl bg-slate-900 px-3 py-2 text-lg font-black tracking-tight text-white transition group-hover:bg-slate-700">
                    PwnIt
                  </span>
                  <span className="text-sm font-bold uppercase tracking-wide text-slate-500">2.0</span>
                </Link>
                <div className="lg:hidden">
                  <AuthStatusShell />
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <HeaderNav />
                <div className="hidden lg:block">
                  <AuthStatusShell />
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1">{children}</div>

          <footer className="mt-3 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 text-center text-xs font-medium text-slate-500 shadow-sm sm:text-sm">
            PwnIt 2.0 test branch · Skill-first campaign lifecycle foundation · Contact: hello@pwnit.co.za
          </footer>
        </div>
      </body>
    </html>
  );
}
