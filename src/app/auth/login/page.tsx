import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "تسجيل الدخول", robots: { index: false } };

export default function LoginPage() {
  return (
    <AuthShell
      title="تسجيل الدخول"
      description="ادخل إلى حسابك لمتابعة خططك ومهامك من أي جهاز."
      footer={<>ليس لديك حساب؟ <Link href="/auth/register" className="font-semibold text-brand-600 hover:underline">أنشئ حسابًا مجانيًا</Link></>}
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
