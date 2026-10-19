"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, Database, Sparkles } from "lucide-react";
import type { DashboardModel } from "@/lib/analytics";
import { fmtNum, fmtPeriod, fmtSigned } from "@/lib/format";
import { ChartCard, LegendItem, LegendSwatch } from "./ChartCard";
import { KpiCard } from "./KpiCard";
import { DepositCurveChart, RateTrendChart, TransmissionScatter } from "./charts/RateCharts";
import { SectorGrowthChart, SectorSizeChart } from "./charts/CreditCharts";
import { GrowthHistogram, MoneySupplyChart } from "./charts/MoneyCharts";
import { BankRatesChart, LendingHeatmap } from "./charts/BankCharts";

type Range = "3" | "5" | "all";
const RANGES: { id: Range; label: string }[] = [
  { id: "3", label: "3 th" },
  { id: "5", label: "5 th" },
  { id: "all", label: "Semua" },
];

function RangePicker({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <div role="radiogroup" aria-label="Rentang waktu" className="flex rounded-lg border border-line bg-surface-2 p-0.5">
      {RANGES.map((r) => (
        <button
          key={r.id}
          role="radio"
          aria-checked={value === r.id}
          onClick={() => onChange(r.id)}
          className={`h-8 rounded-md px-2.5 text-xs font-medium transition-colors ${value === r.id ? "bg-surface text-ink shadow-sm" : "text-ink-3 hover:text-ink"}`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

function SectionTitle({ id, n, title, children }: { id: string; n: string; title: string; children: ReactNode }) {
  return (
    <div id={id} className="mb-4 mt-14 scroll-mt-20 border-t border-line pt-8">
      <p className="num font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">{n}</p>
      <h2 className="mt-1.5 text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-0.5 text-sm text-ink-2">{children}</p>
    </div>
  );
}

function cutoff(rows: { p: string }[], years: Range) {
  if (years === "all" || !rows.length) return rows;
  const lastP = rows[rows.length - 1].p;
  const d = new Date(Date.UTC(Number(lastP.slice(0, 4)) - Number(years), Number(lastP.slice(5, 7)) - 1 + 1, 1));
  const start = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  return rows.filter((r) => r.p >= start);
}

export function Dashboard({ model }: { model: DashboardModel }) {
  const [range, setRange] = useState<Range>("all");
  const rate = useMemo(() => cutoff(model.rateTrend.rows, range) as DashboardModel["rateTrend"]["rows"], [model, range]);
  const money = useMemo(() => cutoff(model.money.rows, range) as DashboardModel["money"]["rows"], [model, range]);
  const picker = <RangePicker value={range} onChange={setRange} />;

  const m = model;
  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 pb-24 sm:px-8">
      {/* ---------- Ringkasan ---------- */}
      <section aria-label="Indikator utama" className="pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Ringkasan</h1>
            <p className="mt-1 text-sm text-ink-2">
              Data kredit terbaru {m.latestLabel} · sumber {m.origin === "supabase" ? "Supabase (Postgres)" : "hasil ETL lokal"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/data"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
            >
              <Database size={15} aria-hidden /> Data & ETL
            </Link>
            <a
              href="#suku-bunga"
              className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-ink transition-opacity hover:opacity-90"
            >
              Mulai eksplorasi <ArrowDown size={15} aria-hidden />
            </a>
          </div>
        </div>

        <div className="card mt-6 flex items-start gap-3 p-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warn-bg text-warn" aria-hidden>
            <Sparkles size={16} />
          </span>
          <div className="min-w-0 text-sm">
            <p className="font-semibold">Sorotan bulan ini</p>
            <p className="mt-0.5 leading-relaxed text-ink-2">{m.scatter.insight}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {m.kpis.map((k) => (
            <KpiCard key={k.id} kpi={k} />
          ))}
        </div>
      </section>

      {/* ---------- 1. Suku bunga ---------- */}
      <SectionTitle id="suku-bunga" n="01 · Suku bunga" title="Bagaimana arah suku bunga?">
        BI Rate, bunga kredit, dan bunga deposito pada satuan yang sama (persen).
      </SectionTitle>
      <div className="grid gap-4">
        <ChartCard
          id="tren-bunga"
          title="BI Rate vs bunga kredit modal kerja vs bunga deposito"
          subtitle="Bunga kredit modal kerja cenderung turun sejak 2018, sementara BI Rate naik-turun mengikuti siklus. Data deposito baru tersedia sejak 2024."
          insight={m.rateTrend.insight}
          controls={picker}
          legend={
            <>
              <LegendItem color="var(--s1)" label="BI Rate" />
              <LegendItem color="var(--s2)" label="Kredit modal kerja, Bank Umum" />
              <LegendItem color="var(--s3)" label="Deposito 12 bulan" />
            </>
          }
          why={{
            chart: "grafik garis (multi-seri)",
            reason:
              "Ketiganya adalah deret waktu bulanan dengan satuan sama (persen), sehingga satu sumbu-Y cukup dan garis paling tepat menunjukkan arah serta titik balik. Garis menyampaikan kontinuitas antar bulan, sesuatu yang tidak bisa disampaikan batang terpisah.",
            rules: [
              "Satu sumbu-Y saja (tanpa dual-axis) karena semua seri berunit persen.",
              "Sumbu-X berskala waktu linear, ticks per tahun; garis 2px tanpa marker agar tidak ramai.",
              "Warna tetap per entitas (BI Rate selalu biru) + label langsung di ujung garis, jadi identitas seri tidak hanya bergantung pada warna.",
              "Tersedia tabel data untuk pembaca dengan buta warna/pembaca layar.",
            ],
          }}
          table={{
            columns: ["Periode", "BI Rate (%)", "Kredit MK (%)", "Deposito 12 bln (%)"],
            rows: [...rate].reverse().map((r) => [fmtPeriod(r.p), r.bi ?? "–", r.kredit ?? "–", r.deposito ?? "–"]),
          }}
        >
          <RateTrendChart rows={rate} />
        </ChartCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            id="kurva-deposito"
            title="Kurva bunga deposito menurut tenor"
            subtitle={`Periode terbaru (${m.depositCurve.nowLabel}) dibanding setahun sebelumnya (${m.depositCurve.prevLabel}).`}
            insight={m.depositCurve.insight}
            legend={
              <>
                <LegendItem color="var(--s1)" label={m.depositCurve.nowLabel} />
                <LegendItem color="var(--s-muted)" label={m.depositCurve.prevLabel} dashed />
              </>
            }
            why={{
              chart: "grafik garis dengan penekanan (emphasis)",
              reason:
                "Tenor (1, 3, 6, 12, 24 bulan) adalah kategori berurutan, sehingga garis yang menghubungkan titik memperlihatkan bentuk kurva (menaik/menurun). Periode terbaru adalah fokus cerita, sedangkan pembanding hanya konteks.",
              rules: [
                "Teknik emphasis: satu seri berwarna aksen, pembanding abu-abu putus-putus (bukan warna ke-2 yang bersaing).",
                "Sumbu-Y dipotong di 3% (boleh untuk garis) dan ditandai jelas oleh tick; nilai periode terbaru diberi label angka.",
              ],
            }}
            table={{
              columns: ["Tenor", m.depositCurve.nowLabel, m.depositCurve.prevLabel],
              rows: m.depositCurve.rows.map((r) => [r.tenor, r.now ?? "–", r.prev ?? "–"]),
            }}
          >
            <DepositCurveChart data={m.depositCurve} />
          </ChartCard>

          <ChartCard
            id="transmisi"
            title="Seberapa kuat BI Rate menentukan bunga kredit?"
            subtitle={`Tiap titik = satu bulan (2018–${m.latestLabel.slice(-4)}). r = ${fmtNum(m.scatter.r, 2)}.`}
            insight={m.scatter.insight}
            legend={
              <>
                <LegendSwatch color="var(--s1)" label="Sebelum 12 bulan terakhir" />
                <LegendSwatch color="var(--s2)" label="12 bulan terakhir" />
                <LegendItem color="var(--ink-2)" label="Tren linear (OLS)" dashed />
              </>
            }
            why={{
              chart: "diagram pencar (scatter plot)",
              reason:
                "Pertanyaannya adalah hubungan dua variabel kontinu. Diagram pencar menampilkan setiap bulan sebagai satu titik, sehingga kekuatan hubungan, pencilan, dan perubahan rezim langsung terlihat; garis tren merangkum kemiringannya.",
              rules: [
                "Dua sumbu bertipe angka dengan label satuan; titik semi-transparan + cincin permukaan agar titik bertumpuk tetap terbaca.",
                "Hanya 2 kategori warna (batas aman untuk bentuk scatter) dan keduanya diberi legenda.",
                "Judul tidak menyebut sebab-akibat: korelasi ≠ kausalitas, dinyatakan eksplisit pada insight.",
              ],
            }}
            table={{
              columns: ["Periode", "BI Rate (%)", "Kredit MK (%)"],
              rows: [...m.scatter.points].reverse().map((p) => [fmtPeriod(p.p), p.x, p.y]),
            }}
          >
            <TransmissionScatter data={m.scatter} />
          </ChartCard>
        </div>
      </div>

      {/* ---------- 2. Kredit sektor ---------- */}
      <SectionTitle id="kredit" n="02 · Kredit" title="Ke mana kredit mengalir?">
        Posisi kredit rupiah + valas per lapangan usaha, {m.sectorSize.period}.
      </SectionTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          id="ukuran-sektor"
          title="Posisi kredit per sektor (Rp triliun)"
          subtitle={`Total ${fmtNum(m.sectorSize.total / 1000, 0)} T rupiah; label = porsi dari total.`}
          insight={m.sectorSize.insight}
          why={{
            chart: "diagram batang horizontal terurut",
            reason:
              "Tujuannya membandingkan besaran antar kategori. Batang membuat panjang mudah dibandingkan (posisi sejajar pada satu garis dasar). Nama sektor panjang sehingga horizontal; diurutkan menurun agar peringkat langsung terbaca.",
            rules: [
              "Sumbu mulai dari nol (batang wajib, agar panjang proporsional dengan nilai).",
              "Satu hue (biru) karena hanya satu ukuran; warna beragam per batang tidak menambah informasi.",
              "Bukan pie/donut: 18 kategori terlalu banyak untuk irisan.",
              "Ujung batang membulat 4px, label persentase di ujung supaya tidak perlu menelusuri sumbu.",
            ],
          }}
          table={{
            columns: ["Sektor", "Rp triliun", "Porsi (%)"],
            rows: m.sectorSize.rows.map((r) => [r.label, fmtNum(r.value / 1000, 1), fmtNum(r.share, 1)]),
          }}
        >
          <SectorSizeChart data={m.sectorSize} />
        </ChartCard>

        <ChartCard
          id="pertumbuhan-sektor"
          title="Pertumbuhan kredit tahunan per sektor"
          subtitle={`${m.sectorGrowth.period} (YoY). Biru = tumbuh, merah = menyusut.`}
          insight={m.sectorGrowth.insight}
          legend={
            <>
              <LegendSwatch color="var(--div-pos)" label="Tumbuh" />
              <LegendSwatch color="var(--div-neg)" label="Menyusut" />
            </>
          }
          why={{
            chart: "diagram batang divergen (diverging bar)",
            reason:
              "Pertumbuhan punya polaritas: di atas atau di bawah nol. Batang yang keluar dari garis nol ke dua arah dengan dua warna berlawanan menjawab 'naik atau turun, dan berapa' dalam sekali pandang.",
            rules: [
              "Dua hue berlawanan (biru–merah), titik tengah netral di nol; arah juga dikodekan oleh posisi (kiri/kanan), bukan warna saja.",
              "Garis nol ditebalkan sebagai acuan; label bertanda +/− pada tiap batang.",
              "Urut menurun menurut nilai; pertumbuhan dari basis kecil dicatat di insight agar tidak menyesatkan.",
            ],
          }}
          table={{
            columns: ["Sektor", "Pertumbuhan YoY (%)"],
            rows: m.sectorGrowth.rows.map((r) => [r.label, fmtSigned(r.growth, 1)]),
          }}
        >
          <SectorGrowthChart data={m.sectorGrowth} />
        </ChartCard>
      </div>

      {/* ---------- 3. Uang beredar ---------- */}
      <SectionTitle id="uang-beredar" n="03 · Uang beredar" title="Seberapa banyak uang beredar, dan dalam bentuk apa?">
        Komponen M2 dalam triliun rupiah dan distribusi pertumbuhan bulanannya.
      </SectionTitle>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          id="komposisi-m2"
          title="Komposisi uang beredar (M2)"
          subtitle="Tinggi total tumpukan = M2; tiap lapisan = komponennya."
          insight={m.money.insight}
          controls={picker}
          legend={
            <>
              <LegendSwatch color="var(--s1)" label="M1 (kartal + giral)" />
              <LegendSwatch color="var(--s3)" label="Uang kuasi" />
              <LegendSwatch color="var(--s2)" label="SB selain saham" />
            </>
          }
          why={{
            chart: "grafik area bertumpuk (stacked area)",
            reason:
              "Ada dua hal yang ingin dilihat sekaligus: total M2 dari waktu ke waktu dan bagaimana tiap komponen menyusunnya (part-to-whole terhadap waktu). Area bertumpuk menjawab keduanya dalam satu bentuk.",
            rules: [
              "Komponen saling lepas dan berjumlah M2 (M1 + uang kuasi + SB); pada data selisih terbesar hanya 0,02% dari M2 (pembulatan), sehingga penumpukan sah.",
              "Hanya 3 lapisan dengan warna kategorikal tetap; celah 2px warna permukaan memisahkan segmen.",
              "Lapisan dasar adalah komponen terbesar (uang kuasi) agar lapisan kecil di atas tetap terbaca.",
            ],
          }}
          table={{
            columns: ["Periode", "M1 (Rp T)", "Uang kuasi (Rp T)", "SB (Rp T)"],
            rows: [...money].reverse().map((r) => [fmtPeriod(r.p), fmtNum(r.m1, 1), fmtNum(r.kuasi, 1), fmtNum(r.sb, 1)]),
          }}
        >
          <MoneySupplyChart rows={money} />
        </ChartCard>

        <ChartCard
          id="distribusi-m2"
          title="Distribusi pertumbuhan M2 bulanan"
          subtitle={`${m.histogram.stats.n} bulan sejak 2016; tinggi batang = jumlah bulan pada rentang tsb.`}
          insight={m.histogram.insight}
          why={{
            chart: "histogram",
            reason:
              "Pertumbuhan bulanan adalah variabel kontinu; yang ingin diketahui adalah bentuk distribusinya (pusat, sebaran, ekor/pencilan), bukan urutan waktunya. Histogram membagi nilai ke dalam rentang dan menghitung frekuensi.",
            rules: [
              "Batang saling menempel (celah kecil) karena sumbu-X kontinu, berbeda dari bar chart kategori.",
              "Lebar rentang tetap 0,5 pp; sumbu-Y mulai dari nol (frekuensi).",
              "Statistik ringkas (rata-rata, median, simpangan baku) ditampilkan di bawah agar angka tidak hanya ditebak dari batang.",
            ],
          }}
          table={{
            columns: ["Rentang pertumbuhan (%)", "Jumlah bulan"],
            rows: m.histogram.bins.map((b) => [b.label, b.count]),
          }}
        >
          <GrowthHistogram data={m.histogram} />
        </ChartCard>
      </div>

      {/* ---------- 4. Bank ---------- */}
      <SectionTitle id="bank" n="04 · Kelompok bank" title="Siapa yang memberi bunga kredit paling murah?">
        Suku bunga kredit rupiah menurut kelompok bank dan tujuan kredit.
      </SectionTitle>
      <div className="grid gap-4">
        <ChartCard
          id="bunga-bank"
          title={`Bunga kredit per kelompok bank (${m.bankRates.period})`}
          subtitle="Tiga tujuan kredit berdampingan pada tiap kelompok bank."
          insight={m.bankRates.insight}
          legend={
            <>
              <LegendSwatch color="var(--s1)" label="Modal kerja" />
              <LegendSwatch color="var(--s2)" label="Investasi" />
              <LegendSwatch color="var(--s3)" label="Konsumsi" />
            </>
          }
          why={{
            chart: "diagram batang berkelompok (grouped bar)",
            reason:
              "Dua dimensi kategori (kelompok bank × tujuan kredit) pada satu periode. Batang berkelompok memungkinkan perbandingan antar-kelompok bank (jarak antar grup) sekaligus antar-tujuan (dalam grup).",
            rules: [
              "Tiga seri saja (batas aman untuk warna kategorikal); setiap batang berlabel angka karena nilai ekstrem (konsumsi bank asing) membuat batang lain pendek.",
              "Sumbu mulai dari nol; ujung batang membulat 4px.",
            ],
          }}
          table={{
            columns: ["Kelompok bank", "Modal kerja (%)", "Investasi (%)", "Konsumsi (%)"],
            rows: m.bankRates.rows.map((r) => [r.group, r.mk ?? "–", r.inv ?? "–", r.kons ?? "–"]),
          }}
        >
          <BankRatesChart data={m.bankRates} />
        </ChartCard>

        <ChartCard
          id="heatmap"
          title="Peta panas bunga kredit: bank × tahun"
          subtitle="Rata-rata tahunan; makin pekat = bunga makin tinggi (skala per tujuan kredit)."
          insight={m.heat.insight}
          why={{
            chart: "peta panas (heatmap)",
            reason:
              "Tiga dimensi: kelompok bank, tahun, dan besaran bunga. Heatmap menaruh dua dimensi kategori pada baris/kolom dan mengkodekan besaran lewat intensitas warna, sehingga pola tren per bank dan perbedaan antar-bank terlihat tanpa 5 garis yang saling berpotongan.",
            rules: [
              "Warna sequential satu hue (terang → pekat), bukan pelangi; urutan kecerahan = urutan nilai.",
              "Angka tetap ditampilkan di tiap sel (warna bukan satu-satunya saluran informasi) dan teks otomatis kontras terhadap latar.",
              "Skala dihitung per tujuan kredit supaya variasi bunga modal kerja tidak tertelan oleh bunga konsumsi yang jauh lebih tinggi.",
            ],
          }}
          table={{
            columns: ["Tujuan", "Kelompok bank", ...m.heat.years.map(String)],
            rows: m.heat.purposes.flatMap((p) => p.rows.map((r) => [p.label, r.group, ...r.cells.map((c) => (c.value === null ? "–" : fmtNum(c.value, 2)))])),
          }}
        >
          <LendingHeatmap data={m.heat} />
        </ChartCard>
      </div>

      <p className="mt-12 text-center text-xs text-ink-3">
        Sumber: BPS – Tabel Statistik Perbankan, Asuransi dan Finansial (data asli Bank Indonesia), diolah lewat pipeline ETL proyek ini.
      </p>
    </div>
  );
}
