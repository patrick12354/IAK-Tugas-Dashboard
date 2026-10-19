import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Masuk · Perbankan ID" };

export default function LoginPage() {
  return (
    <AuthShell
      title="Selamat datang kembali"
      subtitle="Masuk untuk membuka dashboard perbankan."
      footer={
        <>
          Belum punya akun?{" "}
          <Link href="/signup" className="font-medium text-white underline-offset-4 hover:underline">
            Buat akun
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
