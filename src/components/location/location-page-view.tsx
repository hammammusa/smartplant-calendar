"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LocationPicker } from "./location-picker";
import { LocationSummary } from "./location-summary";

export function LocationPageView() {
  const { mode } = useAppData();
  const [confirmed, setConfirmed] = useState(false);
  if (mode === "loading") return <Skeleton className="h-96 w-full rounded-2xl" />;
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <LocationPicker onConfirmed={() => setConfirmed(true)} />
      <aside className="flex flex-col gap-4">
        <h2 className="font-bold">الموقع المحفوظ</h2>
        <LocationSummary />
        {confirmed ? (
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4">
            <p className="font-semibold">ما الخطوة التالية؟</p>
            <Button asChild><Link href="/recommendations">ماذا أزرع الآن في منطقتي؟ <ArrowLeft /></Link></Button>
            <Button asChild variant="outline"><Link href="/weather">طقس موقعي</Link></Button>
            <Button asChild variant="outline"><Link href="/planner">أنشئ خطة زراعية</Link></Button>
          </div>
        ) : null}
        <div className="rounded-2xl border border-border bg-surface p-4 text-sm leading-7 text-muted-foreground">
          <p className="mb-1 font-bold text-foreground">خصوصية موقعك</p>
          <ul className="list-disc space-y-1 ps-5">
            <li>تحديد GPS يتم داخل جهازك، ولا يُرسل أي شيء قبل موافقتك على الخدمات الخارجية.</li>
            <li>يُحفظ موقعك في هذا المتصفح، أو في ملفك الشخصي إن كنت مسجلًا، ولا يراه غيرك.</li>
            <li>لا نستخدم أدوات تحليلات، ولا نضع الإحداثيات في روابط الصفحات.</li>
            <li>يمكنك حذف الموقع المحفوظ في أي وقت.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
