import Link from "next/link";
import { notFound } from "next/navigation";
import { CropEditor } from "@/components/admin/crop-editor";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { uuidSchema } from "@/domain/schemas";
import { getServerSupabase } from "@/lib/supabase/server";
import { CROP_SELECT, mapCropRow, type CropRow } from "@/services/crop-mapper";

export default async function EditCropPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const { data } = await supabase.from("crops").select(CROP_SELECT).eq("id", id).maybeSingle();
  if (!data) notFound();
  const crop = mapCropRow(data as CropRow);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`تعديل: ${crop.name}`}
        actions={<Button asChild variant="outline"><Link href={`/crops/${crop.slug}`} target="_blank">عرض الصفحة العامة</Link></Button>}
      />
      <CropEditor crop={crop} cropId={id} published={(data as CropRow).is_published ?? true} />
    </div>
  );
}
