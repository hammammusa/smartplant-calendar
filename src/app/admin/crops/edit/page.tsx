import { Suspense } from "react";
import { AdminCropEdit } from "@/components/admin/admin-pages";
import { AdminLoading } from "@/components/admin/admin-shell";

// Static export: one page for new and existing crops; the crop id comes from ?id=.
export default function AdminCropEditPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminCropEdit />
    </Suspense>
  );
}
