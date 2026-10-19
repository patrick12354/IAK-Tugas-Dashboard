"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const base = "field-dark h-11 w-full rounded-xl px-3.5 text-[15px] text-white placeholder:text-white/30";

export function Field({ label, hint, ...props }: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-[13px] font-medium text-white/80">
      {label}
      <input className={`${base} mt-1.5`} {...props} />
      {hint && <span className="mt-1 block text-xs font-normal text-white/40">{hint}</span>}
    </label>
  );
}

export function PasswordField({ label, hint, ...props }: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <label className="block text-[13px] font-medium text-white/80">
      {label}
      <span className="relative mt-1.5 block">
        <input className={`${base} pr-11`} type={show ? "text" : "password"} {...props} />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-white/40 hover:text-white/80"
        >
          {show ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
        </button>
      </span>
      {hint && <span className="mt-1 block text-xs font-normal text-white/40">{hint}</span>}
    </label>
  );
}

export function Submit({ busy, children }: { busy: boolean; children: string }) {
  return (
    <button type="submit" disabled={busy} className="btn-tactile flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-medium disabled:opacity-60">
      {busy && <Loader2 size={16} className="animate-spin" aria-hidden />}
      {busy ? "Memproses…" : children}
    </button>
  );
}

export function Notice({ kind, children }: { kind: "error" | "info"; children: string }) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={`rounded-xl px-3.5 py-2.5 text-sm ${kind === "error" ? "bg-red-500/10 text-red-200 shadow-[inset_0_0_0_1px_rgba(248,113,113,0.3)]" : "bg-white/[0.05] text-white/80 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"}`}
    >
      {children}
    </p>
  );
}

/** Pesan galat Supabase Auth -> Bahasa Indonesia. */
export function authMessage(msg: string) {
  if (/invalid login credentials/i.test(msg)) return "Email atau kata sandi salah.";
  if (/email not confirmed/i.test(msg)) return "Email belum dikonfirmasi. Cek kotak masuk Anda.";
  if (/already registered|already been registered/i.test(msg)) return "Email ini sudah terdaftar. Silakan masuk.";
  if (/password should be at least/i.test(msg)) return "Kata sandi terlalu pendek (minimal 8 karakter).";
  if (/email address .* is invalid/i.test(msg)) return "Alamat email tidak valid atau domainnya tidak menerima email.";
  if (/not authorized/i.test(msg)) return "Email konfirmasi tidak bisa dikirim ke alamat ini. Hubungi admin.";
  if (/rate limit|too many/i.test(msg)) return "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.";
  if (/weak|pwned/i.test(msg)) return "Kata sandi terlalu lemah. Gunakan kombinasi huruf dan angka.";
  return msg;
}
