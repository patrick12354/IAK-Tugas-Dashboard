export interface Dataset {
  code: string;
  title: string;
  unit: string;
  source_org: string;
  source_url: string;
  source_format: "csv" | "xlsx" | "json";
  bps_table_id: string;
  dimension_label: string;
  bps_last_update: string | null;
}

export interface Dimension {
  dataset_code: string;
  dim_key: number;
  label: string;
}

export interface Observation {
  dataset_code: string;
  dim_key: number;
  segment: string;
  period: string; // YYYY-MM-DD (selalu tanggal 1)
  value: number;
}

export interface EtlRun {
  dataset_code: string;
  source_file: string;
  source_format: string;
  status: string;
  rows_extracted: number;
  rows_loaded: number;
  rows_rejected: number;
  notes: string | null;
  started_at: string;
  finished_at: string | null;
}

export interface Warehouse {
  datasets: Dataset[];
  dimensions: Dimension[];
  observations: Observation[];
  runs: EtlRun[];
  origin: "supabase" | "local";
}
