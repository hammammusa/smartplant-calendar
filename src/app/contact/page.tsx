import { Mail } from "lucide-react";
import { absoluteUrl } from "@/lib/env";
import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/layout/prose-page";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { getContactEmail } from "@/services/content";

export const metadata: Metadata = { title: "تواصل معنا", alternates: { canonical: absoluteUrl("/contact") } };

export default async function ContactPage() {
  const email = await getContactEmail();
  return (
    <ProsePage title="تواصل معنا">
      <p>يسعدنا سماع ملاحظاتك واقتراحاتك، وخاصة تصحيحات مواعيد الزراعة في منطقتك أو محاصيل تود إضافتها إلى الدليل.</p>
      {email ? (
        <Button asChild size="lg">
          <a href={`mailto:${email}`}>
            <Mail /> راسلنا على <span dir="ltr">{email}</span>
          </a>
        </Button>
      ) : (
        <Alert tone="info" title="لم يُحدَّد بريد التواصل بعد">
          يستطيع مشرف المنصة إضافة بريد التواصل من لوحة الإدارة ← الإعدادات العامة.
        </Alert>
      )}
      <p>
        لمعرفة كيف نتعامل مع بياناتك راجع <Link href="/privacy" className="font-semibold text-brand-600 underline">سياسة الخصوصية</Link>.
      </p>
    </ProsePage>
  );
}
