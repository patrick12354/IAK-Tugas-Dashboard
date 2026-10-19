import { Suspense } from "react";
import { ExternalLink } from "lucide-react";
import { PageSkeleton } from "@/components/PageSkeleton";
import { loadWarehouse } from "@/lib/data";
import { fmtNum, fmtPeriod } from "@/lib/format";

export const metadata = { title: "Data & ETL · Dashboard Perbankan" };

const FORMAT_LABEL = { csv: "CSV", xlsx: "XLSX", json: "JSON" } as const;

async function DataContent() {
  const w = await loadWarehouse();

  const stats = w.datasets.map((d) => {
    const obs = w.observations.filter((o) => o.dataset_code === d.code);
    const periods = obs.map((o) => o.period.slice(0, 7)).sort();
    const run = w.runs.find((r) => r.dataset_code === d.code);
    return {
      d,
      rows: obs.length,
      dims: w.dimensions.filter((x) => x.dataset_code === d.code).length,
      from: periods[0],
      to: periods[periods.length - 1],
      run,
    };
  });

  return (
      <div className="mx-auto w-full max-w-[1240px] px-4 pb-24 pt-8 sm:px-8">
        <h1 className="text-2xl font-semibold tracking-tight">Data & pipeline ETL</h1>
        <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-ink-2">
          Lima dataset perbankan dari BPS dalam tiga format sumber (CSV, XLSX, JSON) diekstrak, ditransformasi (unpivot, parsing angka desimal koma,
          validasi, deduplikasi), lalu dimuat ke Postgres di Supabase. Dashboard membaca tabel hasil ETL ini.
        </p>

        <div className="mt-6 flex flex-wrap gap-2 text-xs">
          <span className="rounded-md border border-line bg-surface px-2.5 py-1 text-ink-2">
            Sumber aktif: {w.origin === "supabase" ? "Supabase (Postgres)" : "hasil ETL lokal (data/processed)"}
          </span>
          <span className="rounded-md border border-line bg-surface px-2.5 py-1 text-ink-2">{fmtNum(w.observations.length)} observasi</span>
          <span className="rounded-md border border-line bg-surface px-2.5 py-1 text-ink-2">{w.datasets.length} dataset</span>
        </div>

        <div className="mt-6 overflow-x-auto card">
          <table className="w-full min-w-[900px] border-collapse text-left text-[13px]">
            <thead className="bg-surface-2 text-ink-2">
              <tr>
                {["Dataset", "Format sumber", "Satuan", "Cakupan", "Observasi", "Dimensi", "Run ETL terakhir", "Tabel BPS"].map((h) => (
                  <th key={h} scope="col" className="whitespace-nowrap px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.map(({ d, rows, dims, from, to, run }) => (
                <tr key={d.code} className="border-t border-line align-top">
                  <th scope="row" className="max-w-[320px] px-4 py-3 text-left font-medium">
                    {d.title}
                    <div className="mt-0.5 font-mono text-[11px] font-normal text-ink-3">{d.code} · id {d.bps_table_id}</div>
                  </th>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-surface-2 px-2 py-0.5 font-mono text-xs">{FORMAT_LABEL[d.source_format]}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-2">{d.unit}</td>
                  <td className="num whitespace-nowrap px-4 py-3 text-ink-2">{from && to ? `${fmtPeriod(from)} – ${fmtPeriod(to)}` : "–"}</td>
                  <td className="num px-4 py-3">{fmtNum(rows)}</td>
                  <td className="num px-4 py-3">{dims}</td>
                  <td className="px-4 py-3 text-ink-2">
                    {run ? (
                      <>
                        <span className="num">
                          {run.rows_extracted} baris → {run.rows_loaded} obs
                        </span>
                        <div className="text-[11px] text-ink-3">ditolak {run.rows_rejected} · {run.status}</div>
                      </>
                    ) : (
                      "–"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={d.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-ink underline-offset-2 hover:underline"
                    >
                      Buka <ExternalLink size={12} aria-hidden />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="mt-10 grid gap-4 md:grid-cols-3" aria-label="Tahapan ETL">
          {[
            ["1 · Extract", "Membaca berkas sumber (data/source): CSV berdelimiter titik-koma dengan desimal koma, XLSX (ExcelJS), dan JSON bersarang. Ketiganya dinormalisasi ke bentuk baris-per-kategori-per-tahun."],
            ["2 · Transform", "Unpivot 12 kolom bulan menjadi baris periode, ubah “4,75” menjadi 4.75, “-” menjadi kosong, validasi tahun/nilai, petakan label kategori ke kunci dimensi, hapus duplikat berdasarkan kunci utama."],
            ["3 · Load", "Upsert berbatch ke Supabase (datasets, dimensions, observations) dengan service role, lalu catat audit pada etl_runs. RLS membatasi baca hanya untuk pengguna login."],
          ].map(([t, b]) => (
            <article key={t} className="card p-5">
              <h2 className="font-semibold">{t}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{b}</p>
            </article>
          ))}
        </section>
      </div>
  );
}

export default function DataPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DataContent />
    </Suspense>
  );
}
