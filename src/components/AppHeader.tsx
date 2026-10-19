import Link from "next/link";
import { redirect } from "next/navigation";
import { Landmark, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/supabase/env";
import { ThemeToggle } from "./ThemeToggle";

async function signOut() {
  "use server";
  const sb = await createClient();
  await sb.auth.signOut();
  redirect("/login");
}

const NAV = [
  { href: "/dashboard#suku-bunga", label: "Suku bunga" },
  { href: "/dashboard#kredit", label: "Kredit" },
  { href: "/dashboard#uang-beredar", label: "Uang beredar" },
  { href: "/dashboard#bank", label: "Bank" },
  { href: "/dashboard/data", label: "Data & ETL" },
];

export async function AppHeader() {
  let email: string | null = null;
  if (hasSupabase) {
    const sb = await createClient();
    const { data } = await sb.auth.getClaims();
    email = (data?.claims?.email as string | undefined) ?? null;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-page/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1240px] items-center gap-4 px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-7 items-center justify-center rounded-lg bg-accent text-white">
            <Landmark size={15} aria-hidden />
          </span>
          <span className="hidden sm:inline">Perbankan ID</span>
        </Link>
        <nav aria-label="Navigasi utama" className="-mx-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-sm">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-md px-2.5 py-1.5 text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {email && <span className="hidden max-w-[180px] truncate text-xs text-ink-3 md:inline">{email}</span>}
          <ThemeToggle />
          {hasSupabase && (
            <form action={signOut}>
              <button
                type="submit"
                aria-label="Keluar"
                className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm text-ink-2 transition-colors hover:text-ink"
              >
                <LogOut size={15} aria-hidden />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
