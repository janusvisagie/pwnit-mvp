import type { Metadata } from "next";
import Link from "next/link";

import { AuthStatusShell } from "@/components/AuthStatusShell";
import HeaderNav from "@/components/HeaderNav";

import "./globals.css";

export const metadata: Metadata = {
  title: "PwnIt 2.0",
  description: "Skill-first voucher campaigns that activate before the countdown begins.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f5efe7] text-slate-950 antialiased">
        <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-80 bg-gradient-to-br from-[#ead7c3] via-[#f8f1e9] to-[#dce9df]" />
        <div className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-72 bg-gradient-to-tr from-[#f2e6d9] via-transparent to-[#e4eee6]" />
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 py-3 sm:px-4 sm:py-4">
          <header className="mb-3 rounded-[1.5rem] border border-[#ded0c0] bg-[#fffaf3]/95 p-3 shadow-sm backdrop-blur sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link href="/" className="group flex items-center gap-2" aria-label="PwnIt 2 home">
                  <span className="rounded-2xl bg-[#2f3a32] px-3 py-2 text-lg font-black tracking-tight text-white transition group-hover:bg-[#3f4d43]">
                    PwnIt
                  </span>
                  <span className="rounded-full bg-[#efe1d2] px-2.5 py-1 text-xs font-black uppercase tracking-wide text-[#7c5638] ring-1 ring-[#dbc7b1]">
                    2.0
                  </span>
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

          <footer className="mt-3 rounded-[1.5rem] border border-[#ded0c0] bg-[#fffaf3]/95 px-4 py-3 text-center text-xs font-bold text-[#75695f] shadow-sm backdrop-blur sm:text-sm">
            PwnIt 2.0 test branch · Single voucher campaign foundation · Contact: hello@pwnit.co.za
          </footer>
        </div>
      </body>
    </html>
  );
}
