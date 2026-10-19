"use client";

import { useId, useState, type ReactNode } from "react";
import { Lightbulb, Table2, ChartColumn, Info } from "lucide-react";

export interface TableData {
  columns: string[];
  rows: (string | number)[][];
}

interface Props {
  id: string;
  title: string;
  /** satu kalimat takeaway: apa yang harus dibaca dari grafik ini */
  subtitle: string;
  /** insight bernilai angka yang dihitung dari data */
  insight: string;
  /** alasan pemilihan bentuk grafik (wajib untuk laporan) */
  why: { chart: string; reason: string; rules: string[] };
  table: TableData;
  controls?: ReactNode;
  legend?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ChartCard({ id, title, subtitle, insight, why, table, controls, legend, children, className = "" }: Props) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const uid = useId();

  return (
    <section
      id={id}
      aria-labelledby={`${uid}-t`}
      className={`card flex scroll-mt-20 flex-col p-5 sm:p-6 ${className}`}
    >
      <div>
        <div className="min-w-0">
          <h3 id={`${uid}-t`} className="text-[15px] font-semibold leading-snug tracking-tight">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-ink-2">{subtitle}</p>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">{controls}</div>
          <div role="group" aria-label="Tampilan" className="flex rounded-lg border border-line bg-surface-2 p-0.5">
            <button
              type="button"
              aria-pressed={view === "chart"}
              onClick={() => setView("chart")}
              className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${view === "chart" ? "bg-surface text-ink shadow-sm" : "text-ink-3 hover:text-ink"}`}
            >
              <ChartColumn size={14} aria-hidden /> Grafik
            </button>
            <button
              type="button"
              aria-pressed={view === "table"}
              onClick={() => setView("table")}
              className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${view === "table" ? "bg-surface text-ink shadow-sm" : "text-ink-3 hover:text-ink"}`}
            >
              <Table2 size={14} aria-hidden /> Tabel
            </button>
          </div>
        </div>
      </div>

      {legend && view === "chart" && <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px] text-ink-2">{legend}</div>}

      <div className="mt-4 min-h-0 flex-1">
        {view === "chart" ? children : <DataTable data={table} />}
      </div>

      <p className="mt-4 flex gap-2 rounded-lg border border-line bg-surface-2/60 px-3.5 py-3 text-[13px] leading-relaxed text-ink-2">
        <Lightbulb size={16} className="mt-0.5 shrink-0 text-ink-3" aria-hidden />
        <span>
          <span className="font-semibold text-ink">Insight. </span>
          {insight}
        </span>
      </p>

      <details className="group mt-3 text-[13px] text-ink-2">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 font-medium text-ink-2 hover:text-ink [&::-webkit-details-marker]:hidden">
          <Info size={14} aria-hidden />
          Mengapa memakai {why.chart}?
          <span className="text-ink-3 transition-transform group-open:rotate-90" aria-hidden>
            ›
          </span>
        </summary>
        <div className="mt-2 space-y-2 pl-5 leading-relaxed">
          <p>{why.reason}</p>
          <ul className="list-disc space-y-1 pl-4 text-ink-3">
            {why.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      </details>
    </section>
  );
}

export function DataTable({ data }: { data: TableData }) {
  return (
    <div className="max-h-[360px] overflow-auto rounded-lg border border-line">
      <table className="num w-full border-collapse text-left text-[13px]">
        <thead className="sticky top-0 bg-surface-2 text-ink-2">
          <tr>
            {data.columns.map((c, i) => (
              <th key={c} scope="col" className={`whitespace-nowrap px-3 py-2 font-medium ${i > 0 ? "text-right" : ""}`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r, i) => (
            <tr key={i} className="border-t border-line">
              {r.map((cell, j) => (
                <td key={j} className={`whitespace-nowrap px-3 py-1.5 ${j > 0 ? "text-right" : ""}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LegendItem({ color, label, dashed, muted }: { color: string; label: string; dashed?: boolean; muted?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden
        className="inline-block h-0 w-5 border-t-2"
        style={{ borderColor: color, borderStyle: dashed ? "dashed" : "solid", opacity: muted ? 0.9 : 1 }}
      />
      {label}
    </span>
  );
}

export function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className="inline-block size-2.5 rounded-[3px]" style={{ background: color }} />
      {label}
    </span>
  );
}
