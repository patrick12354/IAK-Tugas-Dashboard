import type { Warehouse } from "./types";
import { fmtNum, fmtPct, fmtPeriod, fmtSigned, fmtTriliun } from "./format";

export interface Pt {
  p: string; // YYYY-MM
  v: number;
}

export interface Kpi {
  id: string;
  label: string;
  value: string;
  note: string; // periode & satuan
  deltaText: string;
  deltaDir: "up" | "down" | "flat";
  spark: Pt[];
}

export interface DashboardModel {
  origin: Warehouse["origin"];
  latestLabel: string;
  kpis: Kpi[];
  rateTrend: { rows: { p: string; bi: number | null; kredit: number | null; deposito: number | null }[]; insight: string };
  depositCurve: { rows: { tenor: string; now: number | null; prev: number | null }[]; nowLabel: string; prevLabel: string; insight: string };
  sectorSize: { rows: { label: string; value: number; share: number }[]; period: string; total: number; insight: string };
  sectorGrowth: { rows: { label: string; growth: number }[]; period: string; insight: string };
  money: { rows: { p: string; m1: number; kuasi: number; sb: number }[]; insight: string };
  bankRates: { rows: { group: string; mk: number | null; inv: number | null; kons: number | null }[]; period: string; insight: string };
  heat: {
    years: number[];
    purposes: { id: "mk" | "inv" | "kons"; label: string; min: number; max: number; rows: { group: string; cells: { year: number; value: number | null; months: number }[] }[] }[];
    insight: string;
  };
  scatter: {
    points: { x: number; y: number; p: string }[];
    line: { x: number; y: number }[];
    r: number;
    slope: number;
    insight: string;
  };
  histogram: {
    bins: { from: number; to: number; label: string; tick: string; count: number }[];
    stats: { n: number; mean: number; median: number; sd: number; min: number; max: number; minP: string; maxP: string };
    insight: string;
  };
}

const SECTOR_SHORT: Record<number, string> = {
  2: "Pertanian, Kehutanan & Perikanan",
  3: "Pertambangan & Penggalian",
  4: "Industri Pengolahan",
  5: "Listrik & Gas",
  6: "Air, Sampah & Limbah",
  7: "Konstruksi",
  8: "Perdagangan & Reparasi",
  9: "Transportasi & Pergudangan",
  10: "Akomodasi & Makan Minum",
  11: "Informasi & Komunikasi",
  12: "Jasa Keuangan & Asuransi",
  13: "Real Estate",
  14: "Jasa Perusahaan",
  15: "Administrasi Pemerintahan",
  16: "Jasa Pendidikan",
  17: "Jasa Kesehatan & Lainnya",
  18: "Jasa Lainnya",
  19: "Konsumsi Rumah Tangga",
};

const BANK_GROUPS = [
  { name: "Bank Persero", mk: 1, inv: 2, kons: 3 },
  { name: "Bank Pemerintah Daerah", mk: 4, inv: 5, kons: 6 },
  { name: "Bank Swasta Nasional", mk: 7, inv: 8, kons: 9 },
  { name: "Bank Asing & Campuran", mk: 10, inv: 11, kons: 12 },
  { name: "Bank Umum (semua)", mk: 13, inv: 14, kons: 15 },
] as const;

// ---------- util ----------
const shift = (p: string, months: number) => {
  const d = new Date(Date.UTC(Number(p.slice(0, 4)), Number(p.slice(5, 7)) - 1 + months, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const sd = (a: number[]) => {
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
};

class Index {
  private map = new Map<string, Pt[]>();
  constructor(w: Warehouse) {
    for (const o of w.observations) {
      const k = `${o.dataset_code}|${o.dim_key}|${o.segment}`;
      let arr = this.map.get(k);
      if (!arr) this.map.set(k, (arr = []));
      arr.push({ p: o.period.slice(0, 7), v: Number(o.value) });
    }
    for (const arr of this.map.values()) arr.sort((a, b) => a.p.localeCompare(b.p));
  }
  series(code: string, dim: number, segment = ""): Pt[] {
    return this.map.get(`${code}|${dim}|${segment}`) ?? [];
  }
}

const at = (pts: Pt[], p: string) => pts.find((x) => x.p === p)?.v ?? null;
const last = (pts: Pt[]) => pts[pts.length - 1];

function addSeries(a: Pt[], b: Pt[]): Pt[] {
  const bm = new Map(b.map((x) => [x.p, x.v]));
  return a.filter((x) => bm.has(x.p)).map((x) => ({ p: x.p, v: x.v + bm.get(x.p)! }));
}

// ---------- model ----------
export function buildModel(w: Warehouse): DashboardModel {
  const ix = new Index(w);

  const bi = ix.series("bi_rate", 1);
  const kreditMK = ix.series("suku_kredit", 13); // Bank Umum - Modal Kerja
  const dep12 = ix.series("deposito", 4);
  const m2 = ix.series("uang_beredar", 8);
  const m1 = ix.series("uang_beredar", 3);
  const kuasi = ix.series("uang_beredar", 6);
  const sb = ix.series("uang_beredar", 7);

  const totalKredit = addSeries(ix.series("kredit_sektor", 20, "Dalam Rupiah"), ix.series("kredit_sektor", 20, "Dalam Valuta Asing"));
  const sectorTotal = (dim: number) => addSeries(ix.series("kredit_sektor", dim, "Dalam Rupiah"), ix.series("kredit_sektor", dim, "Dalam Valuta Asing"));

  const lastKredit = last(totalKredit);
  const lastM2 = last(m2);

  // ---- KPI ----
  const deltaDir = (d: number): Kpi["deltaDir"] => (Math.abs(d) < 0.005 ? "flat" : d > 0 ? "up" : "down");
  const kpis: Kpi[] = [];

  const biNow = last(bi);
  const biPrev = at(bi, shift(biNow.p, -12));
  kpis.push({
    id: "bi",
    label: "BI Rate",
    value: fmtPct(biNow.v),
    note: `${fmtPeriod(biNow.p)} · persen`,
    deltaText: biPrev === null ? "—" : `${fmtSigned(biNow.v - biPrev, 2, " pp")} vs 12 bln lalu`,
    deltaDir: biPrev === null ? "flat" : deltaDir(biNow.v - biPrev),
    spark: bi.slice(-36),
  });

  const kNow = last(kreditMK);
  const kPrev = at(kreditMK, shift(kNow.p, -12));
  kpis.push({
    id: "lending",
    label: "Suku bunga kredit modal kerja",
    value: fmtPct(kNow.v),
    note: `Bank Umum · ${fmtPeriod(kNow.p)}`,
    deltaText: kPrev === null ? "—" : `${fmtSigned(kNow.v - kPrev, 2, " pp")} vs 12 bln lalu`,
    deltaDir: kPrev === null ? "flat" : deltaDir(kNow.v - kPrev),
    spark: kreditMK.slice(-36),
  });

  const credPrev = at(totalKredit, shift(lastKredit.p, -12));
  kpis.push({
    id: "credit",
    label: "Posisi kredit perbankan",
    value: fmtTriliun(lastKredit.v),
    note: `Rupiah + valas · ${fmtPeriod(lastKredit.p)}`,
    deltaText: credPrev === null ? "—" : `${fmtSigned((lastKredit.v / credPrev - 1) * 100, 1, "%")} YoY`,
    deltaDir: credPrev === null ? "flat" : deltaDir(lastKredit.v - credPrev),
    spark: totalKredit,
  });

  const m2Prev = at(m2, shift(lastM2.p, -12));
  kpis.push({
    id: "m2",
    label: "Uang beredar (M2)",
    value: fmtTriliun(lastM2.v, 0),
    note: `${fmtPeriod(lastM2.p)} · rupiah`,
    deltaText: m2Prev === null ? "—" : `${fmtSigned((lastM2.v / m2Prev - 1) * 100, 1, "%")} YoY`,
    deltaDir: m2Prev === null ? "flat" : deltaDir(lastM2.v - m2Prev),
    spark: m2.slice(-36),
  });

  const spreadSeries: Pt[] = kreditMK.filter((x) => at(dep12, x.p) !== null).map((x) => ({ p: x.p, v: x.v - at(dep12, x.p)! }));
  const spNow = last(spreadSeries);
  const spPrev = at(spreadSeries, shift(spNow.p, -12));
  kpis.push({
    id: "spread",
    label: "Selisih bunga kredit – deposito",
    value: `${fmtNum(spNow.v, 2)} pp`,
    note: `Kredit MK − deposito 12 bln · ${fmtPeriod(spNow.p)}`,
    deltaText: spPrev === null ? "—" : `${fmtSigned(spNow.v - spPrev, 2, " pp")} vs 12 bln lalu`,
    deltaDir: spPrev === null ? "flat" : deltaDir(spNow.v - spPrev),
    spark: spreadSeries,
  });

  // ---- 1. rate trend ----
  const start = "2018-01";
  const periods: string[] = [];
  for (let p = start; p <= biNow.p; p = shift(p, 1)) periods.push(p);
  const rateRows = periods.map((p) => ({ p, bi: at(bi, p), kredit: at(kreditMK, p), deposito: at(dep12, p) }));
  const biPeak = bi.filter((x) => x.p >= start).reduce((a, b) => (b.v > a.v ? b : a));
  const biLow = bi.filter((x) => x.p >= start).reduce((a, b) => (b.v < a.v ? b : a));
  const lowK = at(kreditMK, biLow.p);
  const rateInsight =
    `BI Rate menyentuh titik terendah ${fmtPct(biLow.v)} (${fmtPeriod(biLow.p)}), puncaknya ${fmtPct(biPeak.v)} (${fmtPeriod(biPeak.p)}), dan kini ${fmtPct(biNow.v)} (${fmtPeriod(biNow.p)}). ` +
    (lowK !== null
      ? `Sejak titik terendah itu BI Rate berubah ${fmtSigned(biNow.v - biLow.v, 2, " pp")}, tetapi bunga kredit modal kerja hanya berubah ${fmtSigned(kNow.v - lowK, 2, " pp")} (${fmtPct(lowK)} → ${fmtPct(kNow.v)}): suku bunga kredit tidak mengikuti BI Rate secara mekanis.`
      : "");

  // ---- 2. deposit curve ----
  const tenors = [
    { k: 1, l: "1 bln" },
    { k: 2, l: "3 bln" },
    { k: 3, l: "6 bln" },
    { k: 4, l: "12 bln" },
    { k: 5, l: "24 bln" },
  ];
  const depLastP = last(ix.series("deposito", 1)).p;
  const depPrevP = shift(depLastP, -12);
  const depRows = tenors.map((t) => ({ tenor: t.l, now: at(ix.series("deposito", t.k), depLastP), prev: at(ix.series("deposito", t.k), depPrevP) }));
  const dep1Now = depRows[0].now!;
  const dep24Now = depRows[4].now!;
  const depInsight =
    `Per ${fmtPeriod(depLastP)}, bunga deposito 1 bulan ${fmtPct(dep1Now)} sedangkan tenor 24 bulan ${fmtPct(dep24Now)}. ` +
    (dep24Now < dep1Now
      ? "Tenor panjang justru berbunga lebih rendah (kurva menurun/inverted)."
      : "Tenor lebih panjang berbunga lebih tinggi (kurva menaik).");

  // ---- 3. sector size & growth ----
  const sectorDims = Object.keys(SECTOR_SHORT).map(Number);
  const secLastP = lastKredit.p;
  const secPrevP = shift(secLastP, -12);
  const sectorRows = sectorDims
    .map((d) => ({ label: SECTOR_SHORT[d], value: at(sectorTotal(d), secLastP) ?? 0, prev: at(sectorTotal(d), secPrevP) }))
    .filter((r) => r.value > 0);
  const sumSectors = sectorRows.reduce((s, r) => s + r.value, 0);
  const sizeRows = sectorRows
    .map((r) => ({ label: r.label, value: r.value, share: (r.value / sumSectors) * 100 }))
    .sort((a, b) => b.value - a.value);
  const top3 = sizeRows.slice(0, 3);
  const sizeInsight =
    `${top3.map((r) => `${r.label} (${fmtNum(r.share, 1)}%)`).join(", ")} menyerap ${fmtNum(top3.reduce((s, r) => s + r.share, 0), 1)}% total kredit ${fmtPeriod(secLastP)}. ` +
    `Kredit konsumsi rumah tangga saja ${fmtNum(sizeRows.find((r) => r.label === SECTOR_SHORT[19])?.share ?? 0, 1)}%.`;

  const growthRows = sectorRows
    .filter((r) => r.prev !== null && r.prev > 0)
    .map((r) => ({ label: r.label, growth: (r.value / r.prev! - 1) * 100 }))
    .sort((a, b) => b.growth - a.growth);
  const shrinking = growthRows.filter((r) => r.growth < 0);
  const topG = growthRows[0];
  const topBase = sectorRows.find((r) => r.label === topG.label)!;
  const growthInsight =
    `Tumbuh tercepat: ${topG.label} (${fmtSigned(topG.growth, 1, "%")}, dari basis kecil: ${fmtTriliun(topBase.prev ?? 0, 1)} → ${fmtTriliun(topBase.value, 1)}). ` +
    (shrinking.length
      ? `${shrinking.length} sektor menyusut, terdalam ${shrinking[shrinking.length - 1].label} (${fmtSigned(shrinking[shrinking.length - 1].growth, 1, "%")}).`
      : "Seluruh sektor tumbuh secara tahunan.");

  // ---- 4. money supply ----
  const moneyStart = "2016-01";
  const moneyRows = m1
    .filter((x) => x.p >= moneyStart && at(kuasi, x.p) !== null && at(sb, x.p) !== null)
    .map((x) => ({ p: x.p, m1: x.v / 1000, kuasi: at(kuasi, x.p)! / 1000, sb: at(sb, x.p)! / 1000 }));
  const mFirst = moneyRows[0];
  const mLast = moneyRows[moneyRows.length - 1];
  const m2First = mFirst.m1 + mFirst.kuasi + mFirst.sb;
  const m2Last = mLast.m1 + mLast.kuasi + mLast.sb;
  const moneyInsight =
    `M2 tumbuh dari Rp ${fmtNum(m2First, 0)} T (${fmtPeriod(mFirst.p)}) menjadi Rp ${fmtNum(m2Last, 0)} T (${fmtPeriod(mLast.p)}), ${fmtNum(m2Last / m2First, 1)}×. ` +
    `Porsi M1 (uang kartal + giral) naik dari ${fmtNum((mFirst.m1 / m2First) * 100, 0)}% ke ${fmtNum((mLast.m1 / m2Last) * 100, 0)}% — dana masyarakat makin banyak berada di bentuk likuid.`;

  // ---- 5. bank group rates (latest) + heatmap ----
  const rateLastP = last(kreditMK).p;
  const bankRows = BANK_GROUPS.map((g) => ({
    group: g.name,
    mk: at(ix.series("suku_kredit", g.mk), rateLastP),
    inv: at(ix.series("suku_kredit", g.inv), rateLastP),
    kons: at(ix.series("suku_kredit", g.kons), rateLastP),
  }));
  const hi = [...bankRows].sort((a, b) => (b.kons ?? 0) - (a.kons ?? 0))[0];
  const lo = [...bankRows].filter((r) => r.mk !== null).sort((a, b) => a.mk! - b.mk!)[0];
  const konsHigher = bankRows.filter((r) => r.kons !== null && r.mk !== null && r.kons > r.mk).length;
  const bankInsight =
    `Per ${fmtPeriod(rateLastP)}, bunga kredit konsumsi tertinggi di ${hi.group} (${fmtPct(hi.kons ?? 0)}); ` +
    `modal kerja termurah di ${lo.group} (${fmtPct(lo.mk ?? 0)}). Kredit konsumsi lebih mahal daripada modal kerja di ${konsHigher} dari ${bankRows.length} kelompok bank.`;

  const years: number[] = [];
  for (let y = 2018; y <= Number(rateLastP.slice(0, 4)); y++) years.push(y);
  const purposes = (
    [
      ["mk", "Modal kerja"],
      ["inv", "Investasi"],
      ["kons", "Konsumsi"],
    ] as const
  ).map(([id, label]) => {
    let min = Infinity;
    let max = -Infinity;
    const rows = BANK_GROUPS.map((g) => {
      const s = ix.series("suku_kredit", g[id]);
      return {
        group: g.name,
        cells: years.map((y) => {
          const vals = s.filter((x) => x.p.startsWith(String(y))).map((x) => x.v);
          const value = vals.length ? mean(vals) : null;
          if (value !== null) {
            min = Math.min(min, value);
            max = Math.max(max, value);
          }
          return { year: y, value, months: vals.length };
        }),
      };
    });
    return { id, label, rows, min, max };
  });
  const mkRows = purposes[0].rows;
  const foreign = mkRows.find((r) => r.group === "Bank Asing & Campuran")!.cells;
  const fFirst = foreign[0].value!;
  const fLast = foreign[foreign.length - 1].value!;
  const others = mkRows
    .filter((r) => r.group !== "Bank Asing & Campuran" && r.group !== "Bank Umum (semua)")
    .map((r) => r.cells[r.cells.length - 1].value!);
  const heatInsight =
    `Bunga modal kerja Bank Asing & Campuran turun dari ${fmtPct(fFirst)} (rata-rata ${years[0]}) ke ${fmtPct(fLast)} (${years[years.length - 1]}, YTD); ` +
    `rata-rata tiga kelompok bank lain pada ${years[years.length - 1]} adalah ${fmtPct(mean(others))}. Skala warna dihitung per tujuan kredit.`;

  // ---- 6. scatter BI Rate vs lending rate ----
  const points = kreditMK
    .filter((x) => x.p >= start && at(bi, x.p) !== null)
    .map((x) => ({ x: at(bi, x.p)!, y: x.v, p: x.p }));
  const mx = mean(points.map((p) => p.x));
  const my = mean(points.map((p) => p.y));
  const sxx = points.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  const syy = points.reduce((s, p) => s + (p.y - my) ** 2, 0);
  const sxy = points.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  const r = sxy / Math.sqrt(sxx * syy);
  const xs = points.map((p) => p.x);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const scatterInsight =
    `Korelasi BI Rate dan bunga kredit modal kerja r = ${fmtNum(r, 2)} (n = ${points.length} bulan). ` +
    `Setiap kenaikan BI Rate 1 pp berasosiasi dengan kenaikan bunga kredit ${fmtNum(slope, 2)} pp. Ini korelasi, bukan bukti sebab-akibat.`;

  // ---- 7. histogram M2 MoM growth ----
  const growth: { p: string; g: number }[] = [];
  for (const x of m2.filter((y) => y.p >= "2016-01")) {
    const prev = at(m2, shift(x.p, -1));
    if (prev !== null) growth.push({ p: x.p, g: (x.v / prev - 1) * 100 });
  }
  const gVals = growth.map((x) => x.g);
  const width = 0.5;
  const gmin = Math.floor(Math.min(...gVals) / width) * width;
  const gmax = Math.ceil(Math.max(...gVals) / width) * width;
  const bins: DashboardModel["histogram"]["bins"] = [];
  for (let from = gmin; from < gmax - 1e-9; from += width) {
    const to = from + width;
    bins.push({
      from,
      to,
      label: `${fmtNum(from, 1)} – ${fmtNum(to, 1)}`,
      tick: fmtNum(from, 1),
      count: gVals.filter((g) => g >= from && (g < to || (to >= gmax - 1e-9 && g <= to))).length,
    });
  }
  const gMaxItem = growth.reduce((a, b) => (b.g > a.g ? b : a));
  const gMinItem = growth.reduce((a, b) => (b.g < a.g ? b : a));
  const modeBin = bins.reduce((a, b) => (b.count > a.count ? b : a));
  const stats = {
    n: gVals.length,
    mean: mean(gVals),
    median: median(gVals),
    sd: sd(gVals),
    min: gMinItem.g,
    max: gMaxItem.g,
    minP: gMinItem.p,
    maxP: gMaxItem.p,
  };
  const histInsight =
    `Pertumbuhan M2 bulanan rata-rata ${fmtPct(stats.mean)} (median ${fmtPct(stats.median)}, simpangan baku ${fmtNum(stats.sd, 2)} pp); kelompok terbanyak di ${modeBin.label}%. ` +
    `Ekor kanan terpanjang: ${fmtSigned(stats.max, 1, "%")} pada ${fmtPeriod(stats.maxP)}.`;

  return {
    origin: w.origin,
    latestLabel: fmtPeriod(lastKredit.p),
    kpis,
    rateTrend: { rows: rateRows, insight: rateInsight },
    depositCurve: { rows: depRows, nowLabel: fmtPeriod(depLastP), prevLabel: fmtPeriod(depPrevP), insight: depInsight },
    sectorSize: { rows: sizeRows, period: fmtPeriod(secLastP), total: sumSectors, insight: sizeInsight },
    sectorGrowth: { rows: growthRows, period: `${fmtPeriod(secLastP)} vs ${fmtPeriod(secPrevP)}`, insight: growthInsight },
    money: { rows: moneyRows, insight: moneyInsight },
    bankRates: { rows: bankRows, period: fmtPeriod(rateLastP), insight: bankInsight },
    heat: { years, purposes, insight: heatInsight },
    scatter: {
      points,
      line: [
        { x: x0, y: intercept + slope * x0 },
        { x: x1, y: intercept + slope * x1 },
      ],
      r,
      slope,
      insight: scatterInsight,
    },
    histogram: { bins, stats, insight: histInsight },
  };
}
