import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { StorageNotice } from "@/components/layout/storage-notice";
import { TasksManager } from "@/components/tasks/tasks-manager";

export const metadata: Metadata = { title: "المهام والتذكيرات", robots: { index: false } };

export default function TasksPage() {
  return (
    <div className="container-page flex flex-col gap-6 py-8 sm:py-10">
      <PageHeader
        eyebrow="المهام"
        title="المهام والتذكيرات"
        description="أنجز مهامك اليومية، وأجّل ما يلزم، وأضف مهامك الخاصة. التذكيرات تظهر داخل المنصة فقط حاليًا."
      />
      <StorageNotice />
      <TasksManager />
    </div>
  );
}
