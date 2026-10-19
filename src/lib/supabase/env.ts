export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Jika false, aplikasi berjalan "mode lokal": tanpa login, data dibaca dari data/processed/bundle.json. */
export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY);
