import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { Kpi } from "@/lib/analytics";

function Sparkline({ data }: { data: Kpi["spark"] }) {
  if (data.length < 2) return null;
  const w = 200;
  const h = 40;
  const pad = 4;
  const vs = data.map((d) => d.v);
  const min = Math.min(...vs);
  const max = Math.max(...vs);
  const span = max - min || 1;
  const pts = data.map((d, i) => [pad + (i / (data.length - 1)) * (w - pad * 2), h - pad - ((d.v - min) / span) * (h - pad * 2)]);
  const path = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const [lx, ly] = pts[pts.length - 1];
  return (
    <div className="relative h-10 w-full" aria-hidden>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
        <path d={path} fill="none" stroke="var(--s1)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <span
        className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-[var(--s1)] box-content"
        style={{ left: `${(lx / w) * 100}%`, top: `${(ly / h) * 100}%` }}
      />
    </div>
  );
}

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = kpi.deltaDir === "up" ? ArrowUpRight : kpi.deltaDir === "down" ? ArrowDownRight : Minus;
  return (
    <article className="flex flex-col rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <h3 className="text-[13px] font-medium leading-snug text-ink-2">{kpi.label}</h3>
      <p className="num mt-2 whitespace-nowrap text-[26px] font-semibold leading-none tracking-tight">{kpi.value}</p>
      <p className="num mt-3 flex items-start gap-1 text-[12.5px] font-medium leading-snug text-ink">
        <Icon size={14} className="mt-px shrink-0" aria-hidden />
        <span>{kpi.deltaText}</span>
      </p>
      <p className="mt-0.5 text-[12px] leading-snug text-ink-3">{kpi.note}</p>
      <div className="mt-auto pt-3">
        <Sparkline data={kpi.spark} />
      </div>
    </article>
  );
}
