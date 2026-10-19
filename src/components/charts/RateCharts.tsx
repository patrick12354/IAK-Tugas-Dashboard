"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { DashboardModel } from "@/lib/analytics";
import { fmtNum, fmtPct, fmtPeriod } from "@/lib/format";
import { ChartTip, type TipProps } from "./ChartTip";

const yearTicks = (ps: string[]) => ps.filter((p) => p.endsWith("-01"));

type Rate = DashboardModel["rateTrend"]["rows"][number];

function endLabel(lastIdx: number, text: string, dy = 4) {
  // Label langsung di ujung garis (identitas seri tidak bergantung warna saja).
  return function EndLabel(props: { x?: number | string; y?: number | string; index?: number }) {
    if (props.index !== lastIdx) return <g />;
    return (
      <text x={Number(props.x) + 9} y={Number(props.y)} dy={dy} fontSize={12} fontWeight={600} fill="var(--ink)">
        {text}
      </text>
    );
  };
}

export function RateTrendChart({ rows }: { rows: Rate[] }) {
  const lastIdx = (k: "bi" | "kredit" | "deposito") => rows.reduce((a, r, i) => (r[k] !== null ? i : a), 0);
  const val = (k: "bi" | "kredit" | "deposito") => rows[lastIdx(k)][k];
  return (
    <div className="h-[340px] w-full" role="img" aria-label="Grafik garis BI Rate, suku bunga kredit modal kerja, dan deposito 12 bulan">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 12, right: 128, left: 0, bottom: 4 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="p" ticks={yearTicks(rows.map((r) => r.p))} tickFormatter={(p: string) => p.slice(0, 4)} tickMargin={8} />
          <YAxis domain={[2, 12]} ticks={[2, 4, 6, 8, 10, 12]} tickFormatter={(v: number) => `${v}%`} width={44} />
          <Tooltip
            cursor={{ stroke: "var(--axis)", strokeWidth: 1 }}
            content={(p) => (
              <ChartTip
                {...(p as unknown as TipProps)}
                title={p.label ? fmtPeriod(String(p.label)) : ""}
                rows={(e) => (e.value == null ? null : { label: String(e.name), value: fmtPct(Number(e.value)), color: e.color })}
              />
            )}
          />
          <Line
            name="Suku bunga kredit modal kerja"
            dataKey="kredit"
            stroke="var(--s2)"
            strokeWidth={2}
            dot={false}
            connectNulls
            activeDot={{ r: 4.5, stroke: "var(--surface)", strokeWidth: 2 }}
            isAnimationActive={false}
            label={endLabel(lastIdx("kredit"), `Kredit MK ${fmtNum(val("kredit")!, 2)}%`)}
          />
          <Line
            name="BI Rate"
            dataKey="bi"
            stroke="var(--s1)"
            strokeWidth={2}
            dot={false}
            connectNulls
            activeDot={{ r: 4.5, stroke: "var(--surface)", strokeWidth: 2 }}
            isAnimationActive={false}
            label={endLabel(lastIdx("bi"), `BI Rate ${fmtNum(val("bi")!, 2)}%`, -4)}
          />
          <Line
            name="Deposito 12 bulan"
            dataKey="deposito"
            stroke="var(--s3)"
            strokeWidth={2}
            dot={false}
            connectNulls
            activeDot={{ r: 4.5, stroke: "var(--surface)", strokeWidth: 2 }}
            isAnimationActive={false}
            label={endLabel(lastIdx("deposito"), `Depo 12 bln ${fmtNum(val("deposito")!, 2)}%`, 10)}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DepositCurveChart({ data }: { data: DashboardModel["depositCurve"] }) {
  return (
    <div className="h-[340px] w-full" role="img" aria-label="Grafik garis suku bunga deposito menurut tenor, periode terbaru dibanding 12 bulan sebelumnya">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.rows} margin={{ top: 16, right: 24, left: 0, bottom: 4 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="tenor" tickMargin={8} />
          <YAxis domain={[3, 7]} ticks={[3, 4, 5, 6, 7]} tickFormatter={(v: number) => `${v}%`} width={44} />
          <Tooltip
            cursor={{ stroke: "var(--axis)", strokeWidth: 1 }}
            content={(p) => (
              <ChartTip
                {...(p as unknown as TipProps)}
                title={`Tenor ${p.label ?? ""}`}
                rows={(e) => (e.value == null ? null : { label: String(e.name), value: fmtPct(Number(e.value)), color: e.color })}
              />
            )}
          />
          <Line
            name={data.prevLabel}
            dataKey="prev"
            stroke="var(--s-muted)"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={{ r: 4, fill: "var(--surface)", stroke: "var(--s-muted)", strokeWidth: 2 }}
            activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
          <Line
            name={data.nowLabel}
            dataKey="now"
            stroke="var(--s1)"
            strokeWidth={2.5}
            dot={{ r: 4.5, fill: "var(--s1)", stroke: "var(--surface)", strokeWidth: 2 }}
            activeDot={{ r: 6, stroke: "var(--surface)", strokeWidth: 2 }}
            isAnimationActive={false}
            label={{ position: "top", fontSize: 12, fontWeight: 600, fill: "var(--ink)", formatter: (v: unknown) => fmtNum(Number(v), 2) }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TransmissionScatter({ data }: { data: DashboardModel["scatter"] }) {
  const lastP = data.points[data.points.length - 1].p;
  const cutoff = (() => {
    const d = new Date(Date.UTC(Number(lastP.slice(0, 4)), Number(lastP.slice(5, 7)) - 1 - 11, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  })();
  const older = data.points.filter((p) => p.p < cutoff);
  const recent = data.points.filter((p) => p.p >= cutoff);
  const dot = (fill: string) =>
    function Dot(props: { cx?: number; cy?: number }) {
      return <circle cx={props.cx} cy={props.cy} r={5} fill={fill} fillOpacity={0.7} stroke="var(--surface)" strokeWidth={1.5} />;
    };
  return (
    <div className="h-[340px] w-full" role="img" aria-label="Diagram pencar BI Rate terhadap suku bunga kredit modal kerja dengan garis tren">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 12, right: 20, left: 0, bottom: 24 }}>
          <CartesianGrid />
          <XAxis
            type="number"
            dataKey="x"
            name="BI Rate"
            domain={[3, 8]}
            ticks={[3, 4, 5, 6, 7, 8]}
            tickFormatter={(v: number) => `${v}%`}
            label={{ value: "BI Rate (%)", position: "insideBottom", offset: -14, fill: "var(--ink-3)", fontSize: 12 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Kredit MK"
            domain={[7, 11]}
            ticks={[7, 8, 9, 10, 11]}
            tickFormatter={(v: number) => `${v}%`}
            width={48}
            label={{ value: "Bunga kredit MK (%)", angle: -90, position: "insideLeft", offset: 12, fill: "var(--ink-3)", fontSize: 12, style: { textAnchor: "middle" } }}
          />
          <ZAxis range={[60, 60]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3", stroke: "var(--axis)" }}
            content={(p) => {
              const first = (p.payload as readonly { payload?: { p?: string; x?: number; y?: number } }[] | undefined)?.find((e) => e.payload?.p)?.payload;
              if (!first || first.p === undefined) return null;
              return (
                <ChartTip
                  active={p.active}
                  payload={[{ name: "x" }, { name: "y" }]}
                  title={fmtPeriod(first.p)}
                  rows={(e) =>
                    e.name === "x"
                      ? { label: "BI Rate", value: fmtPct(first.x ?? 0), color: "var(--s1)" }
                      : { label: "Kredit modal kerja", value: fmtPct(first.y ?? 0), color: "var(--s2)" }
                  }
                />
              );
            }}
          />
          <Scatter name="Sebelumnya" data={older} fill="var(--s1)" shape={dot("var(--s1)")} isAnimationActive={false} />
          <Scatter name="12 bulan terakhir" data={recent} fill="var(--s2)" shape={dot("var(--s2)")} isAnimationActive={false} />
          <Scatter
            name="Tren linear"
            data={data.line}
            line={{ stroke: "var(--ink-2)", strokeWidth: 2, strokeDasharray: "6 4" }}
            shape={() => <g />}
            legendType="none"
            isAnimationActive={false}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
