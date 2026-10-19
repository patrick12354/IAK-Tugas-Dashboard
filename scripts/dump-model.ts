/** Ekspor model dashboard (angka + insight) ke JSON agar laporan memakai angka yang identik dengan dashboard. */
import fs from "node:fs";
import path from "node:path";
import bundle from "../data/processed/bundle.json";
import { buildModel } from "../src/lib/analytics";
import type { Warehouse } from "../src/lib/types";

const model = buildModel({ ...(bundle as unknown as Omit<Warehouse, "origin">), origin: "local" });
const out = path.join(process.cwd(), "paper", "script", "model.json");
fs.writeFileSync(out, JSON.stringify({ model, bundle: { runs: bundle.runs, datasets: bundle.datasets } }, null, 1));
console.log("model ->", out);
