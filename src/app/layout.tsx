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
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
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

        <main className="mx-auto max-w-5xl px-4 py-4">{children}</main>

        <footer className="mt-8 border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-slate-600">
            <div className="flex flex-wrap items-center justify-between gap-3">
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
