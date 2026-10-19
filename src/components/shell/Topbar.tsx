"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ChevronRight, Menu, X } from "lucide-react";
import { LogoMark } from "../Logo";
import { ThemeToggle } from "../ThemeToggle";
import { NAV_GROUPS } from "./nav";
import { NavLinks, useActiveSection } from "./Sidebar";

function currentLabel(pathname: string, active: string) {
  for (const g of NAV_GROUPS) for (const it of g.items) if (it.href === pathname && it.hash === active) return it.label;
  return pathname.startsWith("/dashboard/data") ? "Data & ETL" : "Ringkasan";
}

export function Topbar({ account, mobileFooter }: { account: ReactNode; mobileFooter: ReactNode }) {
  const { pathname, active } = useActiveSection();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-page/85 px-4 backdrop-blur-md sm:px-6">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Buka menu"
          className="flex size-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-2 lg:hidden"
        >
          <Menu size={17} aria-hidden />
        </button>
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
          <Link href="/dashboard" className="hidden text-ink-3 hover:text-ink sm:inline">
            Dashboard
          </Link>
          <ChevronRight size={14} className="hidden text-ink-3 sm:block" aria-hidden />
          <span className="truncate font-medium">{currentLabel(pathname, active)}</span>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {account}
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Tutup menu" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[272px] max-w-[85vw] flex-col border-r border-line bg-sidebar">
            <div className="flex h-16 items-center gap-2.5 border-b border-line px-4">
              <LogoMark />
              <span className="text-sm font-semibold">Perbankan ID</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Tutup menu" className="ml-auto text-ink-3 hover:text-ink">
                <X size={18} aria-hidden />
              </button>
            </div>
            <nav aria-label="Navigasi utama" className="flex-1 overflow-y-auto px-3 pt-5">
              <NavLinks onNavigate={() => setOpen(false)} />
            </nav>
            <div className="border-t border-line p-3">{mobileFooter}</div>
          </div>
        </div>
      )}
    </>
  );
}
