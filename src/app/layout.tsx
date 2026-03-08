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
      <body className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900">
        <header className="shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold text-slate-900">
                Pick. Play. <span className="text-lg font-extrabold">PwnIt</span>.
              </div>

              <DemoUserSwitcherShell />
              <CreditsPill />
            </div>

            <Nav />
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-[1180px] flex-1 min-h-0 px-3 py-2">
          <div className="w-full min-h-0 overflow-y-auto">{children}</div>
        </main>

        <footer className="shrink-0 border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-[1180px] px-3 py-3 text-xs text-slate-600">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-semibold text-slate-900">Contact</div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>
                  WhatsApp: <span className="font-semibold text-slate-900">+27 00 000 0000</span> (demo)
                </span>
                <span>
                  Email: <span className="font-semibold text-slate-900">support@pwnit.local</span> (demo)
                </span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
