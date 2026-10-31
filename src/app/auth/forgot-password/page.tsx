import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "استعادة كلمة المرور", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="استعادة كلمة المرور"
      description="أدخل بريدك الإلكتروني وسنرسل لك رابطًا لتعيين كلمة مرور جديدة."
      footer={<Link href="/auth/login" className="font-semibold text-brand-600 hover:underline">العودة إلى تسجيل الدخول</Link>}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
