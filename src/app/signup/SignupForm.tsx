"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Field, Notice, PasswordField, Submit, authMessage } from "@/components/auth/fields";

const MIN_PASSWORD = 8;

export function SignupForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const password = String(f.get("password"));
    setError(null);
    setInfo(null);
    if (password !== String(f.get("confirm"))) {
      setError("Konfirmasi kata sandi tidak sama.");
      return;
    }

    setBusy(true);
    const { data, error } = await createClient().auth.signUp({
      email: String(f.get("email")).trim(),
      password,
      options: {
        // Disalin ke public.profiles oleh trigger; hanya untuk tampilan, bukan otorisasi.
        data: { full_name: String(f.get("name")).trim() },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });
    setBusy(false);

    if (error) return setError(authMessage(error.message));
    // Supabase tidak mengembalikan error untuk email yang sudah terdaftar (anti enumerasi); identities kosong = sudah ada.
    if (data.user && data.user.identities?.length === 0) return setError("Email ini sudah terdaftar. Silakan masuk.");
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }
    setInfo("Akun dibuat. Cek email Anda untuk tautan konfirmasi, lalu masuk.");
    form.reset();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Nama lengkap" name="name" autoComplete="name" required maxLength={80} placeholder="Nama Anda" />
      <Field label="Email" name="email" type="email" autoComplete="email" required placeholder="nama@email.com" />
      <PasswordField
        label="Kata sandi"
        name="password"
        autoComplete="new-password"
        required
        minLength={MIN_PASSWORD}
        placeholder={`Minimal ${MIN_PASSWORD} karakter`}
      />
      <PasswordField label="Ulangi kata sandi" name="confirm" autoComplete="new-password" required minLength={MIN_PASSWORD} placeholder="Ketik ulang" />
      {error && <Notice kind="error">{error}</Notice>}
      {info && <Notice kind="info">{info}</Notice>}
      <Submit busy={busy}>Buat akun</Submit>
    </form>
  );
}
