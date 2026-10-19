/**
 * Menyusun berkas sumber (data/source) dalam 3 format berbeda: CSV, XLSX, JSON.
 * Input : data/raw/bps_compact.json (hasil tarik tabel statistik BPS) + data/raw/meta.json
 * Output: layout lebar ala tabel BPS (baris = kategori x tahun, kolom = Januari..Desember),
 *         sehingga tahap Transform pada ETL harus melakukan unpivot, parsing angka, dan validasi.
 */
import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";

const ROOT = process.cwd();
const RAW = path.join(ROOT, "data", "raw");
const OUT = path.join(ROOT, "data", "source");

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

type Row = [number, number, number, (number | null)[]];
const compact = JSON.parse(fs.readFileSync(path.join(RAW, "bps_compact.json"), "utf8")) as Record<string, Row[]>;
const meta = JSON.parse(fs.readFileSync(path.join(RAW, "meta.json"), "utf8"));

const FORMAT: Record<string, "csv" | "xlsx" | "json"> = {
  bi_rate: "csv",
  deposito: "csv",
  kredit_sektor: "xlsx",
  suku_kredit: "json",
  uang_beredar: "json",
};

function expand(code: string) {
  const m = meta[code];
  return compact[code].map(([dim, seg, year, vals]) => ({
    dimension: m.dims[String(dim)] as string,
    segment: seg === 0 ? "" : (m.turvar[String(seg)] as string),
    year,
    values: vals,
  }));
}

function csvNumber(v: number | null) {
  return v === null ? "-" : String(v).replace(".", ",");
}

function writeCsv(code: string) {
  const m = meta[code];
  const header = [m.dimLabel, "Tahun", ...MONTHS].join(";");
  const lines = expand(code).map((r) => [r.dimension, r.year, ...r.values.map(csvNumber)].join(";"));
  fs.writeFileSync(path.join(OUT, `${code}.csv`), [header, ...lines].join("\n") + "\n", "utf8");
}

function writeJson(code: string) {
  const m = meta[code];
  const payload = {
    tabel: m.title,
    satuan: m.unit,
    sumber: m.source,
    bps_table_id: m.table_id,
    diperbarui: m.last_update,
    data: expand(code).map((r) => ({
      [m.dimLabel]: r.dimension,
      tahun: r.year,
      bulan: Object.fromEntries(MONTHS.map((mo, i) => [mo, r.values[i]])),
    })),
  };
  fs.writeFileSync(path.join(OUT, `${code}.json`), JSON.stringify(payload, null, 1), "utf8");
}

async function writeXlsx(code: string) {
  const m = meta[code];
  const wb = new ExcelJS.Workbook();
  wb.creator = "BPS - Tabel Statistik (diekspor untuk tugas IAK)";
  const ws = wb.addWorksheet("Data");
  ws.addRow([m.title]);
  ws.addRow([`Satuan: ${m.unit} | Sumber: ${m.source} | Diperbarui: ${m.last_update}`]);
  ws.addRow([]);
  ws.addRow([m.dimLabel, "Mata Uang", "Tahun", ...MONTHS]);
  for (const r of expand(code)) {
    ws.addRow([r.dimension, r.segment, r.year, ...r.values.map((v) => (v === null ? "-" : v))]);
  }
  ws.getRow(4).font = { bold: true };
  ws.columns.forEach((c, i) => (c.width = i === 0 ? 60 : 14));
  await wb.xlsx.writeFile(path.join(OUT, `${code}.xlsx`));
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const [code, fmt] of Object.entries(FORMAT)) {
    if (fmt === "csv") writeCsv(code);
    if (fmt === "json") writeJson(code);
    if (fmt === "xlsx") await writeXlsx(code);
    console.log(`source: ${code}.${fmt}`);
  }
}

main();
