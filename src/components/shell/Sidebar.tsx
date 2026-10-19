"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { LogoMark } from "../Logo";
import { NAV_GROUPS, SECTION_IDS } from "./nav";

/** Bagian dashboard yang sedang terlihat, untuk menandai menu aktif saat menggulir. */
export function useActiveSection() {
  const pathname = usePathname();
  const [active, setActive] = useState("");

  useEffect(() => {
    if (pathname !== "/dashboard") return;
    // Konten dashboard di-stream setelah shell, jadi elemen dicari ulang setiap kali (bukan sekali saat mount).
    const onScroll = () => {
      let cur = "";
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 140) cur = id;
      }
      setActive(cur);
    };
    onScroll();
    const t = window.setTimeout(onScroll, 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  return { pathname, active: pathname === "/dashboard" ? active : "" };
}

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname, active } = useActiveSection();
  return (
    <>
      {NAV_GROUPS.map((g) => (
        <div key={g.label} className="mb-5">
          <p className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-3">{g.label}</p>
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const isActive = pathname === it.href && active === it.hash;
              const Icon = it.icon;
              return (
                <li key={it.label}>
                  <Link
                    href={it.hash ? `${it.href}#${it.hash}` : it.href}
                    onClick={onNavigate}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors ${
                      isActive ? "bg-surface text-ink shadow-[0_0_0_1px_var(--border)] font-medium" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                    }`}
                  >
                    <Icon size={16} className={isActive ? "text-ink" : "text-ink-3"} aria-hidden />
                    {it.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}

export function Sidebar({ footer }: { footer: ReactNode }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-line bg-sidebar lg:flex">
      <Link href="/" className="flex h-16 items-center gap-2.5 border-b border-line px-4">
        <LogoMark />
        <span className="leading-tight">
          <span className="block text-sm font-semibold tracking-tight">Perbankan ID</span>
          <span className="block font-mono text-[11px] text-ink-3">bps · bank indonesia</span>
        </span>
      </Link>
      <nav aria-label="Navigasi utama" className="flex-1 overflow-y-auto px-3 pt-5">
        <NavLinks />
      </nav>
      <div className="border-t border-line p-3">{footer}</div>
    </aside>
  );
}
