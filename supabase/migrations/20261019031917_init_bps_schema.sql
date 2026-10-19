-- Skema data warehouse mini untuk dashboard perbankan (sumber: BPS / Bank Indonesia).
-- Model: star schema sederhana -> datasets (dimensi dataset), dimensions (dimensi kategori),
-- observations (fakta bulanan), etl_runs (audit pipeline).

create table public.datasets (
  code              text primary key,
  title             text not null,
  unit              text not null,
  subject           text not null default 'Perbankan, Asuransi dan Finansial',
  source_org        text not null,
  source_url        text not null,
  source_format     text not null check (source_format in ('csv', 'xlsx', 'json')),
  bps_table_id      text not null,
  dimension_label   text not null,
  bps_last_update   timestamptz,
  loaded_at         timestamptz not null default now()
);

create table public.dimensions (
  dataset_code text not null references public.datasets (code) on delete cascade,
  dim_key      integer not null,
  label        text not null,
  primary key (dataset_code, dim_key)
);

create table public.observations (
  dataset_code text not null,
  dim_key      integer not null,
  segment      text not null default '',
  period       date not null,
  value        numeric not null,
  primary key (dataset_code, dim_key, segment, period),
  foreign key (dataset_code, dim_key) references public.dimensions (dataset_code, dim_key) on delete cascade
);

create index observations_period_idx on public.observations (dataset_code, period);

create table public.etl_runs (
  id              bigint generated always as identity primary key,
  dataset_code    text not null,
  source_file     text not null,
  source_format   text not null,
  status          text not null check (status in ('success', 'failed')),
  rows_extracted  integer not null default 0,
  rows_loaded     integer not null default 0,
  rows_rejected   integer not null default 0,
  notes           text,
  started_at      timestamptz not null default now(),
  finished_at     timestamptz
);

-- Data hanya dibaca oleh pengguna yang sudah login; penulisan hanya lewat service role (ETL).
alter table public.datasets      enable row level security;
alter table public.dimensions    enable row level security;
alter table public.observations  enable row level security;
alter table public.etl_runs      enable row level security;

create policy "authenticated can read datasets"     on public.datasets     for select to authenticated using (true);
create policy "authenticated can read dimensions"   on public.dimensions   for select to authenticated using (true);
create policy "authenticated can read observations" on public.observations for select to authenticated using (true);
create policy "authenticated can read etl_runs"     on public.etl_runs     for select to authenticated using (true);

-- Tabel baru tidak otomatis terekspos ke Data API; beri akses baca eksplisit.
grant select on public.datasets, public.dimensions, public.observations, public.etl_runs to authenticated;
grant all on public.datasets, public.dimensions, public.observations, public.etl_runs to service_role;
grant usage, select on sequence public.etl_runs_id_seq to service_role;
