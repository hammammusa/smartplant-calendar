import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthConfirm } from "@/components/auth/auth-confirm";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "تأكيد الحساب", robots: { index: false } };

export default function ConfirmPage() {
  return (
    <AuthShell title="جارٍ التحقق من الرابط" description="لحظات ونكمل تسجيل دخولك.">
      <Suspense>
        <AuthConfirm />
      </Suspense>
    </AuthShell>
  );
}
