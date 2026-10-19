"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DashboardModel } from "@/lib/analytics";
import { fmtNum, fmtSigned } from "@/lib/format";
import { ChartTip, type TipProps } from "./ChartTip";

export function SectorSizeChart({ data }: { data: DashboardModel["sectorSize"] }) {
  const rows = data.rows.map((r) => ({ ...r, triliun: r.value / 1000 }));
  return (
    <div className="w-full" style={{ height: rows.length * 30 + 40 }} role="img" aria-label="Diagram batang horizontal posisi kredit per sektor, diurutkan dari terbesar">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 64, left: 0, bottom: 4 }} barCategoryGap={6}>
          <CartesianGrid horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(v: number) => fmtNum(v, 0)}
            domain={[0, (max: number) => Math.ceil(max / 500) * 500]}
            tickCount={6}
            label={{ value: "Rp triliun", position: "insideBottomRight", offset: -2, fill: "var(--ink-3)", fontSize: 12 }}
          />
          <YAxis type="category" dataKey="label" width={188} tickLine={false} interval={0} />
          <Tooltip
            cursor={{ fill: "var(--surface-2)" }}
            content={(p) => (
              <ChartTip
                {...(p as unknown as TipProps)}
                title={String(p.label ?? "")}
                rows={(e) => {
                  const d = e.payload as { triliun: number; share: number } | undefined;
                  return d
                    ? { label: "Posisi kredit", value: `Rp ${fmtNum(d.triliun, 1)} T` }
                    : null;
                }}
              />
            )}
          />
          <Bar dataKey="triliun" fill="var(--seq-bar)" radius={[0, 4, 4, 0]} isAnimationActive={false}>
            <LabelList
              dataKey="share"
              position="right"
              offset={8}
              fontSize={12}
              fill="var(--ink-2)"
              formatter={(v: unknown) => `${fmtNum(Number(v), 1)}%`}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SectorGrowthChart({ data }: { data: DashboardModel["sectorGrowth"] }) {
  const maxV = Math.max(...data.rows.map((r) => r.growth));
  const minV = Math.min(...data.rows.map((r) => r.growth));
  const hi = Math.ceil((maxV + 8) / 20) * 20;
  const lo = Math.floor((Math.min(minV, 0) - 8) / 20) * 20;
  const ticks: number[] = [];
  for (let t = lo; t <= hi; t += 20) ticks.push(t);
  // label angka di ujung batang; untuk nilai negatif ditaruh di kiri ujung batang agar tidak menabrak label kategori
  const endLabel = (props: { x?: number | string; y?: number | string; width?: number | string; height?: number | string; value?: unknown }) => {
    const x = Number(props.x);
    const y = Number(props.y);
    const w = Number(props.width);
    const v = Number(props.value);
    const neg = v < 0;
    return (
      <text x={neg ? x + Math.min(w, 0) - 6 : x + Math.max(w, 0) + 6} y={y + Number(props.height) / 2} dy={4} fontSize={12} fill="var(--ink-2)" textAnchor={neg ? "end" : "start"}>
        {fmtSigned(v, 1, "%")}
      </text>
    );
  };
  return (
    <div className="w-full" style={{ height: data.rows.length * 30 + 40 }} role="img" aria-label="Diagram batang horizontal pertumbuhan kredit tahunan per sektor, positif biru dan negatif merah">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data.rows} layout="vertical" margin={{ top: 4, right: 48, left: 0, bottom: 4 }} barCategoryGap={6}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" domain={[lo, hi]} ticks={ticks} tickFormatter={(v: number) => `${v}%`} />
          <YAxis type="category" dataKey="label" width={188} tickLine={false} interval={0} axisLine={false} />
          <ReferenceLine x={0} stroke="var(--ink-3)" strokeWidth={1.5} />
          <Tooltip
            cursor={{ fill: "var(--surface-2)" }}
            content={(p) => (
              <ChartTip
                {...(p as unknown as TipProps)}
                title={String(p.label ?? "")}
                rows={(e) => (e.value == null ? null : { label: "Pertumbuhan tahunan", value: fmtSigned(Number(e.value), 1, "%") })}
              />
            )}
          />
          <Bar dataKey="growth" radius={4} isAnimationActive={false}>
            {data.rows.map((r) => (
              <Cell key={r.label} fill={r.growth >= 0 ? "var(--div-pos)" : "var(--div-neg)"} />
            ))}
            <LabelList dataKey="growth" content={endLabel} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
