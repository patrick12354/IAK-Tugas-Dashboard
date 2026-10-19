import { connection } from "next/server";
import bundle from "../../data/processed/bundle.json";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/supabase/env";
import type { Dataset, Dimension, EtlRun, Observation, Warehouse } from "./types";

const PAGE = 1000; // batas default PostgREST (max rows)

async function fetchAll<T>(
  run: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await run(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

function fromBundle(): Warehouse {
  return {
    datasets: bundle.datasets as Dataset[],
    dimensions: bundle.dimensions as Dimension[],
    observations: bundle.observations as Observation[],
    runs: bundle.runs as EtlRun[],
    origin: "local",
  };
}

/** Baca data warehouse dari Supabase (jika terkonfigurasi & terisi), selain itu dari hasil ETL lokal. */
export async function loadWarehouse(): Promise<Warehouse> {
  if (!hasSupabase) return fromBundle();
  await connection(); // data dibaca dengan sesi pengguna (RLS), jadi selalu saat request

  try {
    const sb = await createClient();
    const [datasets, dimensions, runs, observations] = await Promise.all([
      fetchAll<Dataset>((f, t) => sb.from("datasets").select("*").order("code").range(f, t)),
      fetchAll<Dimension>((f, t) => sb.from("dimensions").select("*").order("dataset_code").order("dim_key").range(f, t)),
      fetchAll<EtlRun>((f, t) => sb.from("etl_runs").select("*").order("id", { ascending: false }).range(f, t)),
      fetchAll<Observation>((f, t) =>
        sb
          .from("observations")
          .select("dataset_code,dim_key,segment,period,value")
          .order("dataset_code")
          .order("dim_key")
          .order("segment")
          .order("period")
          .range(f, t),
      ),
    ]);
    if (observations.length === 0) return fromBundle(); // ETL belum dijalankan
    return { datasets, dimensions, observations, runs, origin: "supabase" };
  } catch (e) {
    console.error("[data] gagal membaca Supabase, fallback ke data lokal:", e);
    return fromBundle();
  }
}
