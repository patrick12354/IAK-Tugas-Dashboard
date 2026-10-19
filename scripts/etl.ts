/**
 * ETL: Extract (CSV / XLSX / JSON) -> Transform (unpivot, parse, validasi, dedup) -> Load (Supabase).
 *
 *   npm run etl             -> jalankan semua tahap; Load ke Supabase jika env tersedia
 *   npm run etl -- --dry    -> hanya Extract + Transform, tulis data/processed/*.json
 *
 * Env untuk Load: NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY (jangan pernah di-commit).
 */
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, "data", "source");
const PROCESSED = path.join(ROOT, "data", "processed");
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "raw", "meta.json"), "utf8"));

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
type Format = "csv" | "xlsx" | "json";

const SOURCES: { code: string; file: string; format: Format }[] = [
  { code: "bi_rate", file: "bi_rate.csv", format: "csv" },
  { code: "deposito", file: "deposito.csv", format: "csv" },
  { code: "kredit_sektor", file: "kredit_sektor.xlsx", format: "xlsx" },
  { code: "suku_kredit", file: "suku_kredit.json", format: "json" },
  { code: "uang_beredar", file: "uang_beredar.json", format: "json" },
];

/** Bentuk antara hasil Extract, seragam untuk ketiga format. */
interface RawRow {
  dimension: string;
  segment: string;
  year: unknown;
  cells: unknown[]; // 12 sel bulan, belum diparsing
}

// ---------- EXTRACT ----------
async function extract(src: (typeof SOURCES)[number]): Promise<RawRow[]> {
  const full = path.join(SOURCE, src.file);
  const dimLabel: string = meta[src.code].dimLabel;

  if (src.format === "csv") {
    const text = fs.readFileSync(full, "utf8");
    const parsed = Papa.parse<Record<string, string>>(text, { header: true, delimiter: ";", skipEmptyLines: true });
    return parsed.data.map((r) => ({
      dimension: r[dimLabel],
      segment: "",
      year: r["Tahun"],
      cells: MONTHS.map((m) => r[m]),
    }));
  }

  if (src.format === "json") {
    const json = JSON.parse(fs.readFileSync(full, "utf8"));
    return (json.data as Record<string, unknown>[]).map((r) => ({
      dimension: String(r[dimLabel]),
      segment: "",
      year: r["tahun"],
      cells: MONTHS.map((m) => (r["bulan"] as Record<string, unknown>)[m]),
    }));
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(full);
  const ws = wb.getWorksheet("Data")!;
  const out: RawRow[] = [];
  ws.eachRow((row, n) => {
    if (n <= 4) return; // judul, metadata, baris kosong, header
    const v = (i: number) => {
      const c = row.getCell(i).value;
      return c && typeof c === "object" && "result" in c ? c.result : c;
    };
    out.push({
      dimension: String(v(1) ?? ""),
      segment: String(v(2) ?? ""),
      year: v(3),
      cells: MONTHS.map((_, i) => v(4 + i)),
    });
  });
  return out;
}

// ---------- TRANSFORM ----------
function parseValue(x: unknown): number | null {
  if (x === null || x === undefined) return null;
  if (typeof x === "number") return Number.isFinite(x) ? x : null;
  const s = String(x).trim();
  if (s === "" || s === "-" || s === "…") return null; // BPS memakai "-" untuk data belum tersedia
  const n = Number(s.replace(/\./g, "").replace(",", ".")); // "1.234,5" -> 1234.5 ; "4,75" -> 4.75
  return Number.isFinite(n) ? n : NaN;
}

interface Obs {
  dataset_code: string;
  dim_key: number;
  segment: string;
  period: string;
  value: number;
}

function transform(code: string, rows: RawRow[]) {
  const m = meta[code];
  const labelToKey = new Map<string, number>(
    Object.entries<string>(m.dims).map(([k, label]) => [label.trim().toLowerCase(), Number(k)]),
  );
  const seen = new Map<string, Obs>();
  let rejected = 0;
  let duplicates = 0;
  const reasons: Record<string, number> = {};
  const reject = (why: string) => {
    rejected++;
    reasons[why] = (reasons[why] ?? 0) + 1;
  };

  for (const r of rows) {
    const key = labelToKey.get(r.dimension.trim().toLowerCase());
    const year = Number(r.year);
    if (key === undefined) { reject("dimensi tidak dikenal"); continue; }
    if (!Number.isInteger(year) || year < 1990 || year > 2100) { reject("tahun tidak valid"); continue; }
    r.cells.forEach((cell, i) => {
      const value = parseValue(cell);
      if (value === null) return; // sel kosong = belum dirilis, bukan error
      if (Number.isNaN(value)) return reject("nilai bukan angka");
      if (value < 0) return reject("nilai negatif");
      const period = `${year}-${String(i + 1).padStart(2, "0")}-01`;
      const pk = `${code}|${key}|${r.segment}|${period}`;
      if (seen.has(pk)) duplicates++;
      seen.set(pk, { dataset_code: code, dim_key: key, segment: r.segment, period, value }); // last-write-wins
    });
  }
  return { observations: [...seen.values()], rejected, duplicates, reasons };
}

// ---------- LOAD ----------
async function load(
  datasets: unknown[],
  dimensions: unknown[],
  observations: Obs[],
  runs: Record<string, unknown>[],
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log("\n[load] NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diset -> lewati Load ke Supabase.");
    return false;
  }
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const check = (label: string, error: { message: string } | null) => {
    if (error) throw new Error(`${label}: ${error.message}`);
  };

  check("datasets", (await sb.from("datasets").upsert(datasets)).error);
  check("dimensions", (await sb.from("dimensions").upsert(dimensions)).error);
  for (let i = 0; i < observations.length; i += 1000) {
    const batch = observations.slice(i, i + 1000);
    check("observations", (await sb.from("observations").upsert(batch)).error);
    process.stdout.write(`\r[load] observations ${Math.min(i + 1000, observations.length)}/${observations.length}`);
  }
  check("etl_runs", (await sb.from("etl_runs").insert(runs)).error);
  console.log("\n[load] selesai.");
  return true;
}

async function main() {
  const dry = process.argv.includes("--dry");
  fs.mkdirSync(PROCESSED, { recursive: true });

  const allObs: Obs[] = [];
  const datasets: unknown[] = [];
  const dimensions: unknown[] = [];
  const runs: Record<string, unknown>[] = [];

  for (const src of SOURCES) {
    const started = new Date().toISOString();
    const m = meta[src.code];
    const raw = await extract(src);
    const t = transform(src.code, raw);
    const cellCount = raw.length * 12;
    console.log(
      `[etl] ${src.code.padEnd(14)} ${src.format.toUpperCase().padEnd(4)} baris-sumber=${String(raw.length).padStart(3)} ` +
        `-> observasi=${String(t.observations.length).padStart(5)} (sel kosong=${cellCount - t.observations.length - t.rejected}, ditolak=${t.rejected}, duplikat=${t.duplicates})`,
    );
    allObs.push(...t.observations);
    datasets.push({
      code: src.code,
      title: m.title,
      unit: m.unit,
      source_org: m.source,
      source_url: m.page,
      source_format: src.format,
      bps_table_id: m.table_id,
      dimension_label: m.dimLabel,
      bps_last_update: new Date(m.last_update.replace(" ", "T") + "+07:00").toISOString(),
    });
    for (const [k, label] of Object.entries<string>(m.dims)) {
      // hanya dimensi yang benar-benar punya data (mis. baris induk "Pinjaman Berdasarkan Lapangan Usaha" tetap disimpan)
      dimensions.push({ dataset_code: src.code, dim_key: Number(k), label });
    }
    runs.push({
      dataset_code: src.code,
      source_file: src.file,
      source_format: src.format,
      status: "success",
      rows_extracted: raw.length,
      rows_loaded: t.observations.length,
      rows_rejected: t.rejected,
      notes: Object.keys(t.reasons).length ? JSON.stringify(t.reasons) : null,
      started_at: started,
      finished_at: new Date().toISOString(),
    });
  }

  fs.writeFileSync(path.join(PROCESSED, "bundle.json"), JSON.stringify({ datasets, dimensions, observations: allObs, runs }));
  console.log(`[etl] total observasi: ${allObs.length} -> data/processed/bundle.json`);

  if (!dry) await load(datasets, dimensions, allObs, runs);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
