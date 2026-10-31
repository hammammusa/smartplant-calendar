import type { Metadata } from "next";
import { Suspense } from "react";
import { CalendarView } from "@/components/calendar/calendar-view";
import { PageHeader } from "@/components/layout/page-header";
import { StorageNotice } from "@/components/layout/storage-notice";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "الرزنامة الزراعية",
  description: "تابع مواعيد الزراعة والري والتسميد والحصاد في رزنامة شهرية وأسبوعية وقائمة مهام.",
  robots: { index: false },
};

export default function CalendarPage() {
  return (
    <div className="container-page flex flex-col gap-6 py-8 sm:py-10">
      <PageHeader
        eyebrow="الرزنامة"
        title="رزنامتي الزراعية"
        description="اضغط على أي يوم لعرض مهامه، وعلى أي مهمة لتعديلها أو إكمالها أو تأجيلها. التواريخ بتوقيت منطقتك."
      />
      <StorageNotice />
      <Suspense fallback={<Skeleton className="h-[34rem] w-full rounded-2xl" />}>
        <CalendarView />
      </Suspense>
    </div>
  );
}
