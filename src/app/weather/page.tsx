import { Info } from "lucide-react";
import { absoluteUrl } from "@/lib/env";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { LocationSummary } from "@/components/location/location-summary";
import { WeatherPanel } from "@/components/weather/weather-widget";
import { getWeatherThresholds } from "@/services/content";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "الطقس الزراعي",
  description: "توقعات الطقس للأيام القادمة مع تنبيهات زراعية للصقيع والحرارة المرتفعة والأمطار والرياح.",
  alternates: { canonical: absoluteUrl("/weather") },
};


export default async function WeatherPage() {
  const th = await getWeatherThresholds();
  return (
    <div className="container-page flex flex-col gap-6 py-8 sm:py-10">
      <PageHeader
        eyebrow="الطقس الزراعي"
        title="طقس منطقتك وتنبيهاتها الزراعية"
        description="نعرض توقعات الأيام القادمة كما يوفرها مزود الطقس فقط، دون توقعات طويلة المدى غير موثوقة."
      />
      <LocationSummary />
      <WeatherPanel />
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-2 font-bold">كيف نحسب التنبيهات؟</h2>
          <ul className="space-y-1.5 text-sm leading-7 text-muted-foreground">
            <li>احتمال صقيع: عندما تتوقع الصغرى {formatNumber(th.frostTempC)}° أو أقل.</li>
            <li>حرارة مرتفعة: عندما تتوقع العظمى {formatNumber(th.heatTempC)}° أو أكثر.</li>
            <li>احتمال أمطار: عندما يبلغ احتمال الهطول {formatNumber(th.rainProbabilityPct)}٪ أو أكثر.</li>
            <li>أمطار غزيرة: عند توقع {formatNumber(th.heavyRainMm)} ملم أو أكثر في اليوم.</li>
            <li>رياح قوية: عندما تبلغ سرعة الرياح {formatNumber(th.strongWindKmh)} كم/س أو أكثر.</li>
          </ul>
          <p className="mt-2 text-xs text-subtle-foreground">يمكن للمشرف تعديل هذه الحدود من لوحة الإدارة.</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-2 flex items-center gap-2 font-bold"><Info className="size-5 text-info" aria-hidden /> عن الري والطقس</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            لا تعني الحرارة المرتفعة وحدها أن نباتك يحتاج إلى الري. تعتمد الحاجة الفعلية على نوع التربة ورطوبتها، وعمر النبات ونوعه، والتغطية والتظليل. افحص التربة بإصبعك على عمق بضعة سنتيمترات قبل الري، وتجنب الري وقت الظهيرة.
          </p>
        </div>
      </section>
    </div>
  );
}
