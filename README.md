# Dashboard Perbankan Indonesia

Tugas Dashboard EVD (IAK), **Kelompok 8, tema Perbankan**. Dashboard web dengan login, lima dataset BPS dalam tiga format (CSV, XLSX, JSON), pipeline ETL ke Supabase, dan sembilan grafik beralasan.

- Laporan lengkap (DOCX + PDF): [`paper/output/`](paper/output)
- Sumber data: tabel statistik BPS subjek Perbankan, Asuransi dan Finansial (asal: Bank Indonesia)

## Fitur
- Landing page (`/`), **daftar akun** (`/signup`: nama, email, kata sandi) dan **masuk** (`/login`) lewat Supabase Auth; nama disimpan di tabel `profiles` (RLS: hanya pemiliknya)
- Dashboard bersidebar (`/dashboard`), diproteksi oleh `src/proxy.ts`
- 5 KPI dan 9 grafik (garis, kurva, scatter, batang terurut, batang divergen, area bertumpuk, histogram, batang berkelompok, heatmap), tiap grafik punya tampilan tabel, kotak insight, dan penjelasan "mengapa grafik ini"
- Tema terang/gelap, responsif, halaman **Data & ETL**
- Mode lokal: tanpa env Supabase, login dimatikan dan data dibaca dari `data/processed/bundle.json`

## Stack
Next.js 16 (App Router, Cache Components), React 19, Tailwind 4, Recharts, Supabase (Postgres + Auth), tsx untuk skrip ETL.

## Menjalankan
```bash
npm install
npm run dev            # http://localhost:3000 (mode lokal bila belum ada .env.local)
```

## Menghubungkan Supabase
1. Jalankan kedua migrasi di `supabase/migrations/` (urut nama berkas) lewat **SQL Editor**, atau minta agent menerapkannya lewat Supabase MCP.
2. Salin `.env.example` menjadi `.env.local`, isi dari *Project Settings, API*:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (hanya untuk ETL; jangan di-commit, jangan pakai prefix `NEXT_PUBLIC_`)
3. Muat data: `npm run etl` (Extract, Transform, Load ke Supabase).
4. Di *Authentication, Sign In / Providers*, pastikan Email aktif. Untuk demo, matikan **Confirm email** agar akun langsung bisa dipakai; bila tetap aktif, tambahkan `http://localhost:3000/auth/callback` dan URL Vercel ke *URL Configuration, Redirect URLs*.
5. `npm run dev`, buka `/signup` dan buat akun.

## Akses Supabase dari agent (Claude)
Hubungkan connector **Supabase** di Claude (OAuth). Setelah itu agent bisa menjalankan SQL, menerapkan migrasi, membaca log, dan mengecek advisor keamanan tanpa query manual.

## Deploy ke Vercel
Import repo ini di Vercel, lalu isi dua variabel `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Production dan Preview). Kunci `service_role` tidak perlu ada di Vercel.

## Skrip
| Perintah | Fungsi |
|---|---|
| `npm run build:sources` | `data/raw` -> `data/source` (CSV, XLSX, JSON) |
| `npm run etl` | ETL penuh (Load jika env Supabase ada) |
| `npm run etl:dry` | Extract + Transform saja, tulis `data/processed/` |
| `npm run dump:model` | Ekspor angka dashboard ke `paper/script/model.json` (untuk laporan) |
| `npm run typecheck` | Pemeriksaan tipe |

## Struktur
```
data/raw        data mentah BPS (ringkas) + meta.json
data/source     5 berkas sumber: .csv .csv .xlsx .json .json
data/processed  hasil ETL (bundle.json)
scripts/        build-sources.ts, etl.ts, dump-model.ts
supabase/       config + migrations (skema, RLS, grant)
src/lib/        analytics.ts (model + insight), data.ts, supabase/
src/components  shell/ (sidebar, topbar, akun), auth/, kartu grafik, KPI, grafik Recharts
paper/          generator laporan (script/) dan hasil (output/)
```

## Catatan data
Data mentah tiap tabel diambil dari respons JSON halaman tabel BPS (WebAPI resmi butuh kunci pribadi). Berkas CSV/XLSX disusun ulang oleh `scripts/build-sources.ts` dari data itu, bukan unduhan langsung dari BPS. Dataset deposito dan kredit sektoral hanya tersedia sejak 2024; 2026 bersifat parsial.
