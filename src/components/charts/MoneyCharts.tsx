"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DashboardModel } from "@/lib/analytics";
import { fmtNum, fmtPeriod } from "@/lib/format";
import { ChartTip, type TipProps } from "./ChartTip";

export function MoneySupplyChart({ rows }: { rows: DashboardModel["money"]["rows"] }) {
  const ticks = rows.map((r) => r.p).filter((p) => p.endsWith("-01"));
  return (
    <div className="h-[340px] w-full" role="img" aria-label="Grafik area bertumpuk komponen uang beredar M2 dalam triliun rupiah">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="p" ticks={ticks} tickFormatter={(p: string) => p.slice(0, 4)} tickMargin={8} />
          <YAxis tickFormatter={(v: number) => fmtNum(v, 0)} width={56} label={{ value: "Rp triliun", angle: -90, position: "insideLeft", fill: "var(--ink-3)", fontSize: 12, style: { textAnchor: "middle" } }} />
          <Tooltip
            cursor={{ stroke: "var(--axis)", strokeWidth: 1 }}
            content={(p) => {
              const total = (p.payload as readonly { value?: number }[] | undefined)?.reduce((s, e) => s + Number(e.value ?? 0), 0) ?? 0;
              return (
                <ChartTip
                  {...(p as unknown as TipProps)}
                  title={p.label ? `${fmtPeriod(String(p.label))} · M2 Rp ${fmtNum(total, 0)} T` : ""}
                  rows={(e) => (e.value == null ? null : { label: String(e.name), value: `Rp ${fmtNum(Number(e.value), 1)} T`, color: e.color })}
                />
              );
            }}
          />
          {/* urutan tumpukan: dasar = uang kuasi (terbesar), lalu M1, lalu SB; celah 2px antar-segmen lewat stroke warna permukaan */}
          <Area name="Uang kuasi" dataKey="kuasi" stackId="m" stroke="var(--surface)" strokeWidth={2} fill="var(--s3)" fillOpacity={0.95} isAnimationActive={false} />
          <Area name="M1 (kartal + giral)" dataKey="m1" stackId="m" stroke="var(--surface)" strokeWidth={2} fill="var(--s1)" fillOpacity={0.95} isAnimationActive={false} />
          <Area name="SB selain saham" dataKey="sb" stackId="m" stroke="var(--surface)" strokeWidth={2} fill="var(--s2)" fillOpacity={0.95} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GrowthHistogram({ data }: { data: DashboardModel["histogram"] }) {
  return (
    <div className="w-full">
      <div className="h-[300px] w-full" role="img" aria-label="Histogram distribusi pertumbuhan bulanan uang beredar M2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.bins} margin={{ top: 12, right: 12, left: 0, bottom: 28 }} barCategoryGap={2}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="tick"
              interval={1}
              tick={{ fontSize: 11 }}
              label={{ value: "Batas bawah rentang pertumbuhan M2 bulanan (%), lebar 0,5 pp", position: "insideBottom", offset: -20, fill: "var(--ink-3)", fontSize: 12 }}
            />
            <YAxis allowDecimals={false} width={40} label={{ value: "Jumlah bulan", angle: -90, position: "insideLeft", offset: 10, fill: "var(--ink-3)", fontSize: 12, style: { textAnchor: "middle" } }} />
            <Tooltip
              cursor={{ fill: "var(--surface-2)" }}
              content={(p) => (
                <ChartTip
                  {...(p as unknown as TipProps)}
                  title={`Rentang ${(p.payload as unknown as { payload?: { label?: string } }[] | undefined)?.[0]?.payload?.label ?? p.label}%`}
                  rows={(e) => (e.value == null ? null : { label: "Jumlah bulan", value: fmtNum(Number(e.value)) })}
                />
              )}
            />
            <Bar dataKey="count" fill="var(--seq-bar)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <dl className="num mt-3 grid grid-cols-2 gap-2 text-[13px] sm:grid-cols-3">
        {[
          ["n bulan", fmtNum(data.stats.n)],
          ["Rata-rata", `${fmtNum(data.stats.mean, 2)}%`],
          ["Median", `${fmtNum(data.stats.median, 2)}%`],
          ["Simpangan baku", `${fmtNum(data.stats.sd, 2)} pp`],
          ["Min – maks", `${fmtNum(data.stats.min, 1)}% – ${fmtNum(data.stats.max, 1)}%`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg bg-surface-2 px-3 py-2">
            <dt className="text-ink-3">{k}</dt>
            <dd className="font-semibold text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
