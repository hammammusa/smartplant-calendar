import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "تعيين كلمة مرور جديدة", robots: { index: false } };

export default function UpdatePasswordPage() {
  return (
    <AuthShell title="تعيين كلمة مرور جديدة" description="اختر كلمة مرور قوية لا تستخدمها في مواقع أخرى.">
      <UpdatePasswordForm />
    </AuthShell>
  );
}
