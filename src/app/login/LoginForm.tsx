"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    const sb = createClient();

    if (mode === "signin") {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) setError(error.message === "Invalid login credentials" ? "Email atau kata sandi salah." : error.message);
      else {
        router.push("/dashboard");
        router.refresh();
      }
    } else {
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (error) setError(error.message);
      else if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else setInfo("Akun dibuat. Cek email Anda untuk tautan konfirmasi, lalu masuk.");
    }
    setBusy(false);
  }

  const field =
    "h-11 w-full rounded-lg border border-line bg-surface px-3.5 text-[15px] text-ink outline-none placeholder:text-ink-3 focus:border-accent focus:ring-2 focus:ring-accent/25";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{mode === "signin" ? "Masuk" : "Buat akun"}</h2>
        <p className="mt-1 text-sm text-ink-2">{mode === "signin" ? "Masuk untuk membuka dashboard." : "Daftar dengan email dan kata sandi."}</p>
      </div>

      <label className="block text-sm font-medium">
        Email
        <input className={`${field} mt-1.5`} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" />
      </label>
      <label className="block text-sm font-medium">
        Kata sandi
        <input
          className={`${field} mt-1.5`}
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimal 6 karakter"
        />
      </label>

      {error && (
        <p role="alert" className="rounded-lg border border-[var(--div-neg)]/40 bg-[var(--div-neg)]/10 px-3 py-2 text-sm text-ink">
          {error}
        </p>
      )}
      {info && (
        <p role="status" className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink">
          {info}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="h-11 w-full rounded-lg bg-accent text-[15px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {busy ? "Memproses…" : mode === "signin" ? "Masuk" : "Daftar"}
      </button>

      <p className="text-center text-sm text-ink-2">
        {mode === "signin" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
        <button
          type="button"
          className="font-medium text-accent underline-offset-2 hover:underline"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setInfo(null);
          }}
        >
          {mode === "signin" ? "Daftar" : "Masuk"}
        </button>
      </p>
    </form>
  );
}
