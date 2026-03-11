import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import HeaderNav, { HeaderNav as HeaderNavNamed } from "@/components/HeaderNav";
import { DemoUserSwitcherShell } from "@/components/DemoUserSwitcherShell";
import { CreditsPill } from "@/components/CreditsPill";

export const metadata: Metadata = {
  title: "PwnIt",
  description: "Pick. Play. PwnIt.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const Nav = (HeaderNav as any) || (HeaderNavNamed as any);

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 text-slate-950 antialiased">
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-[1380px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <Link
                href="/"
                className="mr-auto inline-flex items-center gap-2 text-lg font-black tracking-tight text-slate-950"
              >
                <span className="text-slate-700">Pick. Play.</span>
                <span>PwnIt.</span>
              </Link>

              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <span className="text-slate-500">Demo user</span>
                <DemoUserSwitcherShell />
              </div>

              <CreditsPill />
            </div>

            <div className="border-t border-slate-100 bg-white/90">
              <div className="mx-auto flex max-w-[1380px] justify-end px-4 py-2 sm:px-6 lg:px-8">
                <Nav />
              </div>
            </div>
          </header>

          <div className="flex-1">{children}</div>

          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto flex max-w-[1380px] flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-slate-600 sm:px-6 lg:px-8">
              <div className="font-medium text-slate-900">Contact</div>
              <div className="flex flex-wrap items-center gap-4">
                <span>WhatsApp: +27 00 000 0000 (demo)</span>
                <span>Email: support@pwnit.local (demo)</span>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
