import type { Metadata } from "next";

import "./globals.css";

import HeaderNav, { HeaderNav as HeaderNavNamed } from "@/components/HeaderNav";
import { DemoUserSwitcherShell } from "@/components/DemoUserSwitcherShell";
import { CreditsPill } from "@/components/CreditsPill";

export const metadata: Metadata = {
  title: "PwnIt",
  description: "Pick. Play. PwnIt.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const Nav = (HeaderNav as any) || (HeaderNavNamed as any);

  return (
    <html lang="en">
      <body className="min-h-dvh overflow-x-hidden text-slate-900 antialiased">
        <div className="grid min-h-dvh grid-rows-[auto_1fr_auto]">
          <header className="sticky top-0 z-40 border-b border-white/70 bg-white/85 backdrop-blur-xl">
            <div className="mx-auto w-full max-w-[1920px] px-3 py-2.5 sm:px-4 sm:py-3 lg:px-6 xl:px-8">
              <div className="rounded-[26px] border border-slate-200/80 bg-white/80 px-3 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.06)] ring-1 ring-white/70 sm:px-4 lg:px-5">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3.5">
                    <div className="rounded-[20px] bg-[linear-gradient(135deg,#020617_0%,#0f172a_45%,#1d4ed8_100%)] px-4 py-3 text-white shadow-lg shadow-slate-900/10">
                      <div className="text-[10px] font-black uppercase tracking-[0.28em] text-white/70 sm:text-[11px]">
                        Live marketplace
                      </div>
                      <div className="mt-1 text-base font-black tracking-tight sm:text-lg">
                        Pick. Play. <span className="text-cyan-300">PwnIt.</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <DemoUserSwitcherShell />
                      <CreditsPill />
                    </div>
                  </div>

                  <div className="-mx-1 overflow-x-auto px-1 xl:mx-0 xl:px-0">
                    <Nav />
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="mx-auto flex min-h-0 w-full max-w-[1920px] px-3 py-3 sm:px-4 sm:py-4 lg:px-6 xl:px-8">
            {children}
          </main>

          <footer className="border-t border-white/70 bg-white/85 backdrop-blur">
            <div className="mx-auto w-full max-w-[1920px] px-3 py-2 text-[11px] text-slate-600 sm:px-4 sm:text-xs lg:px-6 xl:px-8">
              <div className="rounded-[22px] border border-slate-200/80 bg-white/85 px-3 py-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] sm:px-4">
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="font-semibold text-slate-900">Contact</div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1">
                    <span>
                      WhatsApp: <span className="font-semibold text-slate-900">+27 00 000 0000</span> (demo)
                    </span>
                    <span>
                      Email: <span className="font-semibold text-slate-900">support@pwnit.local</span> (demo)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
