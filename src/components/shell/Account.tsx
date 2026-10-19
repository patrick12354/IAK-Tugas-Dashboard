import { cache } from "react";
import { connection } from "next/server";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/supabase/env";

interface Viewer {
  email: string;
  name: string | null;
}

/** Pengguna yang sedang login + nama dari tabel public.profiles (diisi trigger saat daftar). */
const getViewer = cache(async (): Promise<Viewer | null> => {
  if (!hasSupabase) return null;
  await connection(); // sesi pengguna selalu dibaca saat request (getClaims memakai waktu sekarang)
  const sb = await createClient();
  const { data } = await sb.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;
  const { data: profile } = await sb.from("profiles").select("full_name").eq("id", claims.sub).maybeSingle();
  return { email: (claims.email as string | undefined) ?? "", name: profile?.full_name ?? null };
});

function initials(v: Viewer) {
  const src = v.name?.trim() || v.email;
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export async function AccountAvatar() {
  const v = await getViewer();
  if (!v) return null;
  return (
    <span
      title={v.email}
      className="flex size-9 items-center justify-center rounded-full bg-primary text-[12px] font-semibold text-primary-ink"
      aria-label={`Masuk sebagai ${v.name ?? v.email}`}
    >
      {initials(v)}
    </span>
  );
}

export async function AccountCard() {
  if (!hasSupabase) {
    return (
      <div className="card p-3 text-xs leading-relaxed text-ink-2">
        <p className="font-medium text-ink">Mode lokal</p>
        Supabase belum dikonfigurasi; data dibaca dari hasil ETL lokal.
      </div>
    );
  }
  const v = await getViewer();
  if (!v) return null;
  return (
    <div className="flex items-center gap-2.5 rounded-xl p-1.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-ink" aria-hidden>
        {initials(v)}
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-[13px] font-medium">{v.name ?? "Pengguna"}</span>
        <span className="block truncate text-[11.5px] text-ink-3">{v.email}</span>
      </span>
      <form action={signOut}>
        <button
          type="submit"
          aria-label="Keluar"
          title="Keluar"
          className="flex size-8 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <LogOut size={15} aria-hidden />
        </button>
      </form>
    </div>
  );
}
