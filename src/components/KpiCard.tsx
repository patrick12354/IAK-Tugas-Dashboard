import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { Kpi } from "@/lib/analytics";

function Sparkline({ data }: { data: Kpi["spark"] }) {
  if (data.length < 2) return null;
  const w = 160;
  const h = 28;
  const pad = 3;
  const vs = data.map((d) => d.v);
  const min = Math.min(...vs);
  const max = Math.max(...vs);
  const span = max - min || 1;
  const pts = data.map((d, i) => [pad + (i / (data.length - 1)) * (w - pad * 2), h - pad - ((d.v - min) / span) * (h - pad * 2)]);
  const path = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-7 w-full overflow-visible" aria-hidden>
      <path d={path} fill="none" stroke="var(--s1)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
      
    </svg>
  );
}

export function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = kpi.deltaDir === "up" ? ArrowUpRight : kpi.deltaDir === "down" ? ArrowDownRight : Minus;
  // Arah naik/turun tidak otomatis "baik/buruk" untuk suku bunga, jadi pill-nya netral.
  return (
    <article className="card flex flex-col p-4 sm:p-5">
      <h3 className="min-h-[2.6em] text-[11.5px] font-medium uppercase leading-snug tracking-[0.06em] text-ink-3">{kpi.label}</h3>
      <p className="num mt-2 whitespace-nowrap text-[26px] font-semibold leading-none tracking-tight">{kpi.value}</p>
      <div className="mt-3">
        <Sparkline data={kpi.spark} />
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-4 text-[12px]">
        <span className="num inline-flex items-center gap-0.5 rounded-md bg-surface-2 px-1.5 py-0.5 font-medium text-ink">
          <Icon size={13} aria-hidden />
          {kpi.deltaText.replace(/ vs 12 bln lalu| YoY/, "")}
        </span>
        <span className="text-ink-3">{/YoY/.test(kpi.deltaText) ? "YoY" : "vs 12 bln lalu"}</span>
      </div>
      <p className="mt-1.5 text-[11.5px] leading-snug text-ink-3">{kpi.note}</p>
    </article>
  );
}
