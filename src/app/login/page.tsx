import Link from "next/link";
import { Landmark } from "lucide-react";
import { LoginForm } from "./LoginForm";
import { hasSupabase } from "@/lib/supabase/env";

export const metadata = { title: "Masuk · Dashboard Perbankan" };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-[#0d366b] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-white/15">
            <Landmark size={17} aria-hidden />
          </span>
          Perbankan ID
        </div>
        <div>
          <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">Membaca denyut perbankan Indonesia lewat data.</h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/75">
            Suku bunga, kredit sektoral, dan uang beredar dari lima tabel statistik BPS, divisualisasikan dengan pemilihan grafik yang bisa dipertanggungjawabkan.
          </p>
        </div>
        <p className="text-xs text-white/55">Tugas IAK · Kelompok 8 · Sumber: BPS / Bank Indonesia</p>
        <svg aria-hidden viewBox="0 0 400 200" className="pointer-events-none absolute -right-10 bottom-24 w-[560px] opacity-25">
          <polyline fill="none" stroke="#9ec5f4" strokeWidth="3" points="0,150 40,140 80,148 120,110 160,120 200,80 240,92 280,50 320,62 360,28 400,36" />
          <polyline fill="none" stroke="#eb6834" strokeWidth="3" points="0,170 40,168 80,160 120,164 160,150 200,142 240,146 280,120 320,126 360,102 400,108" />
        </svg>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 font-semibold lg:hidden">
            <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-white">
              <Landmark size={17} aria-hidden />
            </span>
            Perbankan ID
          </div>
          {hasSupabase ? (
            <LoginForm />
          ) : (
            <div className="rounded-2xl border border-line bg-surface p-6">
              <h2 className="text-xl font-semibold tracking-tight">Mode lokal</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">
                Supabase belum dikonfigurasi (<code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> dan{" "}
                <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> kosong), jadi login dinonaktifkan dan dashboard membaca hasil ETL lokal.
              </p>
              <Link href="/dashboard" className="mt-5 inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-white">
                Buka dashboard
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
