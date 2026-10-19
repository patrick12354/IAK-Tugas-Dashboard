import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "../Logo";
import { hasSupabase } from "@/lib/supabase/env";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="stage relative isolate flex min-h-screen flex-col overflow-hidden">
      <div className="horizon -z-10 top-[62%]" aria-hidden />
      <div className="glow-top pointer-events-none absolute inset-0 -z-10" aria-hidden />

      <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <LogoMark inverted />
          Perbankan ID
        </Link>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-8 sm:items-center sm:pt-0">
        <div className="rise w-full max-w-[400px] rounded-3xl bg-black/60 p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-white/55">{subtitle}</p>
          <div className="mt-7">
            {hasSupabase ? (
              children
            ) : (
              <div className="rounded-xl bg-white/[0.04] p-4 text-sm leading-relaxed text-white/65 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
                <p className="font-medium text-white">Mode lokal</p>
                Supabase belum dikonfigurasi (<code className="font-mono text-xs">.env.local</code> kosong), jadi login dimatikan dan dashboard membaca hasil ETL
                lokal.
                <Link href="/dashboard" className="btn-tactile mt-4 flex h-10 items-center justify-center rounded-xl text-sm font-medium">
                  Buka dashboard
                </Link>
              </div>
            )}
          </div>
          <p className="mt-6 text-center text-sm text-white/55">{footer}</p>
        </div>
      </main>
    </div>
  );
}
