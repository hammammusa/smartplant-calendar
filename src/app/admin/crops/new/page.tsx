import { CropEditor } from "@/components/admin/crop-editor";
import { PageHeader } from "@/components/layout/page-header";

export default function NewCropPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="إضافة محصول جديد" description="ابدأ بالبيانات الأساسية، ثم أضف المواعيد والقواعد والإرشادات بعد الحفظ." />
      <CropEditor crop={null} cropId={null} published={false} />
    </div>
  );
}
