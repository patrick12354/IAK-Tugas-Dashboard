"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DashboardModel } from "@/lib/analytics";
import { fmtNum, fmtPct } from "@/lib/format";
import { ChartTip, type TipProps } from "./ChartTip";

export function BankRatesChart({ data }: { data: DashboardModel["bankRates"] }) {
  return (
    <div className="h-[340px] w-full" role="img" aria-label="Diagram batang berkelompok suku bunga kredit per kelompok bank dan tujuan kredit">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.rows} margin={{ top: 20, right: 8, left: 0, bottom: 8 }} barCategoryGap="22%" barGap={2}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="group" interval={0} tickMargin={8} tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v: number) => `${v}%`} width={44} />
          <Tooltip
            cursor={{ fill: "var(--surface-2)" }}
            content={(p) => (
              <ChartTip
                {...(p as unknown as TipProps)}
                title={String(p.label ?? "")}
                rows={(e) => (e.value == null ? null : { label: String(e.name), value: fmtPct(Number(e.value)), color: e.color })}
              />
            )}
          />
          {(
            [
              ["mk", "Modal kerja", "var(--s1)"],
              ["inv", "Investasi", "var(--s2)"],
              ["kons", "Konsumsi", "var(--s3)"],
            ] as const
          ).map(([k, name, color]) => (
            <Bar key={k} name={name} dataKey={k} fill={color} radius={[4, 4, 0, 0]} isAnimationActive={false}>
              <LabelList dataKey={k} position="top" fontSize={10.5} fill="var(--ink-2)" formatter={(v: unknown) => fmtNum(Number(v), 1)} />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Mix warna sequential satu hue: t=0 -> terang/lo, t=1 -> pekat/hi. */
const cellColor = (t: number) => `color-mix(in oklab, var(--seq-hi) ${Math.round(t * 100)}%, var(--seq-lo))`;

export function LendingHeatmap({ data }: { data: DashboardModel["heat"] }) {
  const [id, setId] = useState<"mk" | "inv" | "kons">("mk");
  const purpose = data.purposes.find((p) => p.id === id)!;
  const span = purpose.max - purpose.min || 1;
  const lastYear = data.years[data.years.length - 1];

  return (
    <div>
      <div role="tablist" aria-label="Tujuan kredit" className="mb-3 inline-flex rounded-lg border border-line bg-surface-2 p-0.5">
        {data.purposes.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={p.id === id}
            onClick={() => setId(p.id)}
            className={`h-8 rounded-md px-3 text-xs font-medium transition-colors ${p.id === id ? "bg-surface text-ink shadow-sm" : "text-ink-3 hover:text-ink"}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="num w-full min-w-[560px] border-separate border-spacing-[2px] text-center text-[12.5px]">
          <caption className="sr-only">Rata-rata tahunan suku bunga kredit {purpose.label} menurut kelompok bank (persen)</caption>
          <thead>
            <tr>
              <th scope="col" className="w-44 px-2 py-1 text-left font-medium text-ink-3">
                Kelompok bank
              </th>
              {data.years.map((y) => (
                <th key={y} scope="col" className="px-1 py-1 font-medium text-ink-3">
                  {y}
                  {y === lastYear ? "*" : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {purpose.rows.map((r) => (
              <tr key={r.group}>
                <th scope="row" className="px-2 py-1 text-left text-[12.5px] font-medium text-ink-2">
                  {r.group}
                </th>
                {r.cells.map((c) => {
                  if (c.value === null) return <td key={c.year} className="rounded-md bg-surface-2 py-2 text-ink-3">–</td>;
                  const t = (c.value - purpose.min) / span;
                  return (
                    <td
                      key={c.year}
                      title={`${r.group} · ${c.year}: ${fmtNum(c.value, 2)}% (rata-rata ${c.months} bulan)`}
                      className="rounded-md py-2 font-medium"
                      style={{ background: cellColor(t), color: t > 0.5 ? "var(--on-hi)" : "var(--on-lo)" }}
                    >
                      {fmtNum(c.value, 2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center gap-3 text-[12px] text-ink-3" aria-hidden>
        <span className="num">{fmtNum(purpose.min, 1)}%</span>
        <span className="h-2.5 w-40 rounded-full" style={{ background: "linear-gradient(90deg, var(--seq-lo), var(--seq-hi))" }} />
        <span className="num">{fmtNum(purpose.max, 1)}%</span>
        <span className="ml-auto">* {lastYear}: rata-rata sampai bulan terakhir tersedia</span>
      </div>
    </div>
  );
}
