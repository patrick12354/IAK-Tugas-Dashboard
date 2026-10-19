import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChartColumn, ChartLine, ChartScatter, Database, FileJson, FileSpreadsheet, FileText, Grid3x3, Lock, ShieldCheck, Workflow } from "lucide-react";
import bundle from "../../data/processed/bundle.json";
import { LogoMark } from "@/components/Logo";
import { fmtNum } from "@/lib/format";

export const metadata = {
  title: "Perbankan ID · Dashboard data perbankan Indonesia",
};

const FORMAT_ICON = { csv: FileText, xlsx: FileSpreadsheet, json: FileJson } as const;

const DATASETS = bundle.datasets.map((d) => ({
  code: d.code,
  title: d.title,
  format: d.source_format as keyof typeof FORMAT_ICON,
  unit: d.unit,
  rows: bundle.observations.filter((o) => o.dataset_code === d.code).length,
}));

const STEPS = [
  {
    icon: Database,
    title: "Extract",
    body: "Lima tabel BPS dibaca dari tiga format berbeda: CSV bertitik-koma, XLSX, dan JSON bersarang.",
  },
  {
    icon: Workflow,
    title: "Transform",
    body: "Unpivot kolom bulan, parsing desimal koma, validasi nilai, pemetaan dimensi, dan deduplikasi.",
  },
  {
    icon: ShieldCheck,
    title: "Load",
    body: "Upsert berbatch ke Postgres di Supabase dengan audit di etl_runs. RLS membatasi baca ke pengguna login.",
  },
];

const CHARTS = [
  { icon: ChartLine, label: "Garis multi-seri" },
  { icon: ChartScatter, label: "Diagram pencar" },
  { icon: ChartColumn, label: "Batang divergen" },
  { icon: Grid3x3, label: "Peta panas" },
];

function DatasetCard({ d }: { d: (typeof DATASETS)[number] }) {
  const Icon = FORMAT_ICON[d.format];
  return (
    <li className="flex w-[300px] shrink-0 flex-col rounded-2xl bg-white/[0.03] p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
      <div className="flex items-center justify-between">
        <span className="flex size-9 items-center justify-center rounded-full bg-white/[0.06] text-white/80">
          <Icon size={16} aria-hidden />
        </span>
        <span className="rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-[11px] uppercase text-white/70">.{d.format}</span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm font-medium leading-snug text-white">{d.title}</p>
      <p className="mt-auto pt-3 text-xs text-white/45">
        {fmtNum(d.rows)} observasi · {d.unit}
      </p>
    </li>
  );
}

export default function Landing() {
  return (
    <div className="stage min-h-screen overflow-x-clip">
      {/* ---------- Nav ---------- */}
      <header className="relative z-20 mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <LogoMark inverted />
          Perbankan ID
        </Link>
        <nav className="flex items-center gap-1.5 text-sm" aria-label="Akun">
          <Link href="/login" className="rounded-full px-3.5 py-1.5 text-white/70 transition-colors hover:text-white">
            Masuk
          </Link>
          <Link href="/signup" className="btn-tactile rounded-full px-4 py-1.5 font-medium">
            Buat akun
          </Link>
        </nav>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="glow-top relative isolate overflow-hidden px-4 pb-20 pt-16 text-center sm:pt-24">
        <p className="rise mx-auto inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1 text-xs text-white/70 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]">
          <span className="size-1.5 rounded-full bg-[#b9a8ff]" aria-hidden />
          Tugas IAK · Kelompok 8 · Tema Perbankan
        </p>
        <h1 className="rise mx-auto mt-6 max-w-4xl text-[clamp(2.4rem,7vw,4.75rem)] font-semibold leading-[1.02] tracking-[-0.035em]" style={{ animationDelay: "80ms" }}>
          Data perbankan
          <span className="mx-[0.2em] inline-flex translate-y-[-0.08em] align-middle">
            <LogoMark inverted className="size-[0.85em] rounded-[0.22em]" />
          </span>
          <br className="hidden sm:block" />
          <span className="text-white/45">terbaca jelas</span>
        </h1>
        <p className="rise mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-white/60 sm:text-base" style={{ animationDelay: "160ms" }}>
          Suku bunga, kredit sektoral, dan uang beredar Indonesia dari lima tabel statistik BPS, diproses lewat pipeline ETL ke Supabase dan
          divisualisasikan dalam sembilan grafik beralasan.
        </p>
        <div className="rise mt-8 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "240ms" }}>
          <Link href="/signup" className="btn-tactile inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-medium">
            Mulai gratis <ArrowRight size={16} aria-hidden />
          </Link>
          <Link href="/dashboard" className="btn-ghost-dark inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-medium text-white">
            <Lock size={15} aria-hidden /> Buka dashboard
          </Link>
        </div>

        {/* Cakrawala + jendela produk */}
        <div className="relative mx-auto mt-20 max-w-5xl">
          <div className="horizon -z-10 -top-24" aria-hidden />
          <div className="rise overflow-hidden rounded-2xl bg-[#0b0b0b] shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_40px_120px_-20px_rgba(0,0,0,0.9)]" style={{ animationDelay: "320ms" }}>
            <div className="flex h-9 items-center gap-1.5 border-b border-white/[0.08] px-3.5">
              <span className="size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="size-2.5 rounded-full bg-[#febc2e]" />
              <span className="size-2.5 rounded-full bg-[#28c840]" />
              <span className="mx-auto rounded-md bg-white/[0.05] px-3 py-0.5 font-mono text-[11px] text-white/45">perbankan-id / dashboard</span>
            </div>
            <Image
              src="/landing/dashboard.png"
              alt="Tampilan dashboard: kartu indikator utama dan grafik tren suku bunga"
              width={1440}
              height={900}
              priority
              className="block h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* ---------- Dataset marquee ---------- */}
      <section aria-labelledby="ds-title" className="pb-24">
        <h2 id="ds-title" className="text-center text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">
          Lima dataset · tiga format · satu tema
        </h2>
        <div className="relative mt-8 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
          <ul className="marquee flex w-max gap-4">
            {[...DATASETS, ...DATASETS].map((d, i) => (
              <DatasetCard key={`${d.code}-${i}`} d={d} />
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- ETL ---------- */}
      <section className="mx-auto max-w-6xl px-4 pb-28 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">Dari berkas mentah ke insight.</h2>
            <p className="mt-4 max-w-md leading-relaxed text-white/60">
              Setiap angka di dashboard bisa ditelusuri balik ke tabel sumbernya. Pipeline ETL mencatat berapa baris yang diekstrak, dimuat, dan ditolak pada
              setiap run.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {CHARTS.map(({ icon: Icon, label }) => (
                <li key={label} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1 text-xs text-white/70 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
                  <Icon size={13} aria-hidden /> {label}
                </li>
              ))}
              <li className="rounded-full px-1 py-1 text-xs text-white/45">+5 lainnya</li>
            </ul>
          </div>
          <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="flex gap-4 rounded-2xl bg-white/[0.03] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] sm:flex-col lg:flex-row">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-white/85">
                  <Icon size={18} aria-hidden />
                </span>
                <div>
                  <p className="font-mono text-[11px] text-white/40">0{i + 1}</p>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/55">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="relative isolate overflow-hidden px-4 pb-48 pt-24 text-center">
        <div className="horizon -z-10 top-[82%] opacity-80" aria-hidden />
        <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-[-0.02em] sm:text-5xl">Siap membaca denyut perbankan?</h2>
        <p className="mx-auto mt-4 max-w-md text-white/60">Buat akun dengan email dan kata sandi, lalu jelajahi semua grafik dan tabelnya.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/signup" className="btn-tactile inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-medium">
            Buat akun <ArrowRight size={16} aria-hidden />
          </Link>
          <Link href="/login" className="btn-ghost-dark inline-flex h-11 items-center rounded-xl px-5 text-sm font-medium text-white">
            Saya sudah punya akun
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-white/40 sm:px-6">
          <p>© 2026 Kelompok 8 · Integrasi Aplikasi Korporasi</p>
          <p>Sumber: BPS, Tabel Statistik Perbankan (data asli Bank Indonesia)</p>
        </div>
      </footer>
    </div>
  );
}
