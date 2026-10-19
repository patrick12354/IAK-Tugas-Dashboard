"use client";

import type { ReactNode } from "react";

export interface TipEntry {
  name?: string | number;
  value?: number | string | null;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
}
export interface TipProps {
  active?: boolean;
  payload?: readonly TipEntry[];
  label?: string | number;
}

/** Tooltip seragam: judul (periode/kategori) + baris seri dengan penanda warna. */
export function ChartTip({
  active,
  payload,
  title,
  rows,
}: TipProps & {
  title: ReactNode;
  rows: (e: TipEntry) => { label: string; value: string; color?: string } | null;
}) {
  if (!active || !payload?.length) return null;
  const lines = payload.map(rows).filter(Boolean) as { label: string; value: string; color?: string }[];
  if (!lines.length) return null;
  return (
    <div
      role="status"
      className="pointer-events-none min-w-40 rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] shadow-lg"
      style={{ boxShadow: "0 8px 24px rgba(0,0,0,.14)" }}
    >
      <div className="mb-1.5 font-semibold text-ink">{title}</div>
      <ul className="space-y-1">
        {lines.map((l) => (
          <li key={l.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-ink-2">
              {l.color && <span aria-hidden className="inline-block size-2 rounded-full" style={{ background: l.color }} />}
              {l.label}
            </span>
            <span className="num font-medium text-ink">{l.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
