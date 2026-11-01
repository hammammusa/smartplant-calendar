import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { RecommendationsView } from "@/components/recommendations/recommendations-view";
import { absoluteUrl } from "@/lib/env";
import { getCrops } from "@/services/crops";

export const metadata: Metadata = {
  title: "ماذا أزرع الآن في منطقتي؟",
  description: "اقتراحات زراعية حسب موقع أرضك ومنطقتها المناخية وتاريخ اليوم ونوع المساحة وتوقعات الطقس القريبة.",
  alternates: { canonical: absoluteUrl("/recommendations") },
};

export default async function RecommendationsPage() {
  const { crops } = await getCrops();
  return (
    <div className="container-page flex flex-col gap-6 py-8 sm:py-10">
      <PageHeader
        eyebrow="اقتراحات حسب موقعك"
        title="ماذا أزرع الآن في منطقتي؟"
        description="نرتّب المحاصيل حسب مواعيد زراعتها المسجلة لمنطقتك المناخية وتاريخ اليوم، مع مراعاة نوع المساحة وتحذيرات الطقس القريبة."
      />
      <RecommendationsView crops={crops} />
    </div>
  );
}
