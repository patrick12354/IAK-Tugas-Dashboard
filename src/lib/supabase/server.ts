import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Buat client baru untuk setiap request (butuh cookie request tsb). */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Dipanggil dari Server Component (tidak boleh set cookie); sesi di-refresh oleh proxy.
          }
        },
      },
    },
  );
}
