import { Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/feedback";
import { CLIMATE_ZONE_LABELS } from "@/domain/labels";
import type { ClimateZone } from "@/domain/types";
import { formatNumber } from "@/lib/format";
import { getServerSupabase } from "@/lib/supabase/server";

interface Stats {
  users: number;
  users_last_30_days: number;
  gardens: number;
  plantings: number;
  active_plantings: number;
  tasks: number;
  tasks_done: number;
  top_crops: { name: string; count: number }[];
  zones: { zone: ClimateZone; count: number }[];
}

export default async function AdminHome() {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const { data, error } = (await supabase.rpc("admin_stats")) as { data: Stats | null; error: { message: string } | null };
  if (error || !data) {
    return <Alert tone="danger" title="تعذّر تحميل الإحصاءات">تأكد من تطبيق ملفات قاعدة البيانات (migrations) ثم أعد المحاولة.</Alert>;
  }
  const cards = [
    { label: "المستخدمون", value: data.users, sub: `${formatNumber(data.users_last_30_days)} خلال 30 يومًا` },
    { label: "المساحات الزراعية", value: data.gardens },
    { label: "المحاصيل المزروعة", value: data.plantings, sub: `${formatNumber(data.active_plantings)} نشطة` },
    { label: "المهام", value: data.tasks, sub: `${formatNumber(data.tasks_done)} مكتملة` },
  ];
  const maxCrop = Math.max(1, ...data.top_crops.map((c) => c.count));
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="نظرة عامة" description="أرقام فعلية من قاعدة البيانات. لا تُعرض أي بيانات شخصية للمستخدمين." />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
            <p className="text-xs font-semibold text-muted-foreground">{c.label}</p>
            <p className="mt-1 text-3xl font-extrabold">{formatNumber(c.value)}</p>
            {c.sub ? <p className="text-xs text-subtle-foreground">{c.sub}</p> : null}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-3 font-bold">أكثر المحاصيل زراعة</h2>
          {data.top_crops.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد بيانات بعد.</p>
          ) : (
            <ul className="space-y-2">
              {data.top_crops.map((c) => (
                <li key={c.name} className="grid grid-cols-[6rem_1fr_2.5rem] items-center gap-2 text-sm">
                  <span>{c.name}</span>
                  <span className="h-2 rounded-full bg-surface-muted"><span className="block h-full rounded-full bg-lime-600" style={{ width: `${(c.count / maxCrop) * 100}%` }} /></span>
                  <span className="text-end font-semibold">{formatNumber(c.count)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-3 font-bold">المساحات حسب المنطقة المناخية</h2>
          {data.zones.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="size-4" aria-hidden /> لا توجد بيانات بعد.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {data.zones.map((z) => (
                <li key={z.zone} className="flex justify-between"><span>{CLIMATE_ZONE_LABELS[z.zone] ?? z.zone}</span><span className="font-semibold">{formatNumber(z.count)}</span></li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
