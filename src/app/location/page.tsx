import type { Metadata } from "next";
import { LocationPageView } from "@/components/location/location-page-view";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "موقع أرضي", robots: { index: false } };

export default function LocationPage() {
  return (
    <div className="container-page flex flex-col gap-6 py-8 sm:py-10">
      <PageHeader
        eyebrow="الموقع"
        title="حدّد موقع أرضك بدقة"
        description="نستخدم موقع أرضك الحقيقي (وليس أقرب مدينة) لاقتراح ما تزرعه الآن ولعرض طقسها. يمكنك استخدام GPS أو البحث عن قريتك أو اختيار النقطة على الخريطة."
      />
      <LocationPageView />
    </div>
  );
}
