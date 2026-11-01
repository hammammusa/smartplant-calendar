import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { StorageNotice } from "@/components/layout/storage-notice";
import { Skeleton } from "@/components/ui/skeleton";
import { listCrop } from "@/domain/crop-search";
import { getCrops } from "@/services/crops";

export const metadata: Metadata = { title: "لوحة التحكم", robots: { index: false } };

export default async function DashboardPage() {
  const { crops } = await getCrops();
  return (
    <div className="container-page flex flex-col gap-6 py-8 sm:py-10">
      <StorageNotice />
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
        <DashboardView crops={crops.map(listCrop)} />
      </Suspense>
    </div>
  );
}
