import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "./SignupForm";

export const metadata = { title: "Buat akun · Perbankan ID" };

export default function SignupPage() {
  return (
    <AuthShell
      title="Buat akun"
      subtitle="Daftar dengan email dan kata sandi Anda sendiri."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-white underline-offset-4 hover:underline">
            Masuk
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
