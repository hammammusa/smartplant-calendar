import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "إنشاء حساب", robots: { index: false } };

export default function RegisterPage() {
  return (
    <AuthShell
      title="أنشئ حسابك المجاني"
      description="احفظ محاصيلك وخططك ومهامك في حسابك، وجدها على أي جهاز."
      footer={<>لديك حساب بالفعل؟ <Link href="/auth/login" className="font-semibold text-brand-600 hover:underline">سجّل الدخول</Link></>}
    >
      <RegisterForm />
    </AuthShell>
  );
}
