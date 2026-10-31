import { Plus } from "lucide-react";
import Link from "next/link";
import { CropArt } from "@/components/brand/crop-art";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { CATEGORY_LABELS, DATA_STATUS_LABELS } from "@/domain/labels";
import type { Crop } from "@/domain/types";
import { getServerSupabase } from "@/lib/supabase/server";

export default async function AdminCropsPage() {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("crops").select("id, slug, name, category, data_status, is_published, updated_at").order("name");
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="المحاصيل والإرشادات"
        description="أضف المحاصيل وعدّل بياناتها وصورها ومواعيد زراعتها حسب المنطقة وقواعد توليد المهام والإرشادات."
        actions={<Button asChild><Link href="/admin/crops/new"><Plus /> محصول جديد</Link></Button>}
      />
      {error ? <Alert tone="danger">تعذّر تحميل المحاصيل.</Alert> : null}
      {data && data.length === 0 ? (
        <Alert tone="info" title="لا توجد محاصيل في قاعدة البيانات">شغّل ملف البيانات الأولية supabase/seed.sql أو أضف محصولًا جديدًا.</Alert>
      ) : null}
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {(data ?? []).map((c) => (
          <li key={c.id as string}>
            <Link href={`/admin/crops/${c.id}`} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 hover:border-border-strong">
              <span className="size-14 shrink-0 overflow-hidden rounded-lg"><CropArt slug={c.slug as string} /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{c.name as string}</span>
                <span className="block text-xs text-muted-foreground">{CATEGORY_LABELS[c.category as Crop["category"]]}</span>
                <span className="mt-1 flex flex-wrap gap-1">
                  <Badge variant={c.data_status === "reviewed" ? "solid" : "warning"}>{DATA_STATUS_LABELS[c.data_status as Crop["dataStatus"]]}</Badge>
                  {!c.is_published ? <Badge variant="neutral">غير منشور</Badge> : null}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
