import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/env";
import { Suspense } from "react";
import { CropBrowser, CropBrowserFromQuery } from "@/components/crops/crop-browser";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/feedback";
import { listCrop } from "@/domain/crop-search";
import { getCrops } from "@/services/crops";


export const metadata: Metadata = {
  title: "دليل المحاصيل الزراعية",
  description: "دليل عربي للمحاصيل المنزلية في فلسطين وبلاد الشام: مواعيد الزراعة حسب المنطقة، واحتياجات الشمس والري، ومدة النمو، والمشكلات الشائعة.",
  alternates: { canonical: absoluteUrl("/crops") },
};

export default async function CropsPage() {
  const crops = (await getCrops()).crops.map(listCrop);
  return (
    <div className="container-page flex flex-col gap-8 py-10 sm:py-14">
      <PageHeader
        eyebrow="دليل المحاصيل"
        title="ماذا تريد أن تزرع؟"
        description="ابحث في المحاصيل وصفِّها حسب الموسم والمنطقة ونوع المساحة ومستوى الصعوبة، ثم افتح أي محصول لمعرفة طريقة زراعته والعناية به."
      />
      <Alert tone="info" title="عن دقة المعلومات">
        البيانات الحالية أولية وعامة لبلاد الشام، ونوضح ذلك في كل محصول. بعض المحاصيل مدرجة بالاسم فقط («معلومات غير مكتملة») إلى أن نوثّق مواعيدها من مصدر موثوق، ولا نعرض لها موعدًا تقديريًا. استعن بالإرشاد الزراعي في منطقتك عند الحاجة.
      </Alert>
      <Suspense fallback={<CropBrowser crops={crops} />}>
        <CropBrowserFromQuery crops={crops} />
      </Suspense>
    </div>
  );
}
