"use client";

import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CropArt } from "@/components/brand/crop-art";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { COUNTRIES } from "@/data/regions";
import {
  getAdminCrop,
  getAdminSettings,
  getAdminStats,
  listAdminCrops,
  listAdminFaqs,
  listAdminRegions,
  type ActionResultOf,
} from "@/data-access/admin";
import { CATEGORY_LABELS, CLIMATE_ZONE_LABELS, DATA_STATUS_LABELS } from "@/domain/labels";
import type { ClimateZone } from "@/domain/types";
import { formatNumber } from "@/lib/format";
import { AdminLoading } from "./admin-shell";
import { CropEditor } from "./crop-editor";
import { FaqManager } from "./faq-manager";
import { RegionZones } from "./region-zones";
import { SettingsForm } from "./settings-form";

/** Loads data once (and again on `reload`), exposing a loading/error/data state. */
function useLoad<T>(fn: () => Promise<ActionResultOf<T>>) {
  const [state, setState] = useState<{ nonce: number; result: ActionResultOf<T> } | null>(null);
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    let cancelled = false;
    fn().then((result) => !cancelled && setState({ nonce, result }));
    return () => {
      cancelled = true;
    };
  }, [fn, nonce]);
  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { result: state?.result ?? null, reload };
}

const PUBLISH_NOTE = "تُحدَّث الصفحات العامة تلقائيًا مرة يوميًا، أو فورًا عند تشغيل سير عمل النشر يدويًا من GitHub Actions.";

export function AdminOverview() {
  const { result } = useLoad(getAdminStats);
  if (!result) return <AdminLoading />;
  if (!result.ok) return <Alert tone="danger" title="تعذّر تحميل الإحصاءات">{result.error}</Alert>;
  const data = result.data;
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
                <li key={z.zone} className="flex justify-between"><span>{CLIMATE_ZONE_LABELS[z.zone as ClimateZone] ?? z.zone}</span><span className="font-semibold">{formatNumber(z.count)}</span></li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export function AdminCropsList() {
  const { result } = useLoad(listAdminCrops);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="المحاصيل والإرشادات"
        description="أضف المحاصيل وعدّل بياناتها وصورها ومواعيد زراعتها حسب المنطقة وقواعد توليد المهام والإرشادات."
        actions={<Button asChild><Link href="/admin/crops/edit"><Plus /> محصول جديد</Link></Button>}
      />
      <Alert tone="info">{PUBLISH_NOTE}</Alert>
      {!result ? (
        <AdminLoading />
      ) : !result.ok ? (
        <Alert tone="danger">{result.error}</Alert>
      ) : result.data.length === 0 ? (
        <Alert tone="info" title="لا توجد محاصيل في قاعدة البيانات">شغّل ملف البيانات الأولية supabase/seed.sql أو أضف محصولًا جديدًا.</Alert>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {result.data.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/crops/edit?id=${c.id}`} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 hover:border-border-strong">
                <span className="size-14 shrink-0 overflow-hidden rounded-lg"><CropArt slug={c.slug} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{c.name}</span>
                  <span className="block text-xs text-muted-foreground">{CATEGORY_LABELS[c.category]}</span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    <Badge variant={c.data_status === "reviewed" ? "solid" : "warning"}>{DATA_STATUS_LABELS[c.data_status]}</Badge>
                    {!c.is_published ? <Badge variant="neutral">غير منشور</Badge> : null}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AdminCropEdit() {
  const id = useSearchParams().get("id");
  const load = useCallback(() => (id ? getAdminCrop(id) : Promise.resolve({ ok: true as const, data: null })), [id]);
  const { result } = useLoad(load);
  if (!id) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="إضافة محصول جديد" description="ابدأ بالبيانات الأساسية، ثم أضف المواعيد والقواعد والإرشادات بعد الحفظ." />
        <CropEditor crop={null} cropId={null} published={false} />
      </div>
    );
  }
  if (!result) return <AdminLoading />;
  if (!result.ok) return <Alert tone="danger">{result.error}</Alert>;
  if (!result.data) return <Alert tone="warning" title="المحصول غير موجود">ربما حُذف هذا المحصول. <Link href="/admin/crops" className="font-semibold underline">العودة إلى القائمة</Link></Alert>;
  const { crop, published } = result.data;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`تعديل: ${crop.name}`} actions={<Button asChild variant="outline"><Link href={`/crops/${crop.slug}`}>عرض الصفحة العامة</Link></Button>} />
      <Alert tone="info">{PUBLISH_NOTE}</Alert>
      <CropEditor key={id} crop={crop} cropId={id} published={published} />
    </div>
  );
}

export function AdminFaqs() {
  const { result, reload } = useLoad(listAdminFaqs);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="الأسئلة الشائعة" description="تظهر الأسئلة المنشورة في الصفحة الرئيسية حسب الترتيب." />
      <Alert tone="info">{PUBLISH_NOTE}</Alert>
      {!result ? <AdminLoading /> : !result.ok ? <Alert tone="danger">{result.error}</Alert> : <FaqManager faqs={result.data} onChanged={reload} />}
    </div>
  );
}

export function AdminRegions() {
  const { result } = useLoad(listAdminRegions);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="المدن والمناطق المناخية"
        description="المنطقة المناخية لكل مدينة هي ما يقترحه مولّد الخطط افتراضيًا، ويستطيع المستخدم تغييرها. مواعيد الزراعة لكل منطقة تُعدّل من صفحة كل محصول."
      />
      <Alert tone="info">{PUBLISH_NOTE}</Alert>
      {!result ? (
        <AdminLoading />
      ) : !result.ok ? (
        <Alert tone="danger">{result.error}</Alert>
      ) : (
        <RegionZones
          rows={result.data.map((r) => ({
            id: r.id,
            name: r.name,
            zone: r.zone as ClimateZone,
            country: COUNTRIES.find((c) => c.code === r.country_code)?.name ?? r.country_code,
          }))}
        />
      )}
    </div>
  );
}

export function AdminSettings() {
  const { result } = useLoad(getAdminSettings);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="الإعدادات العامة" />
      {!result ? <AdminLoading /> : !result.ok ? <Alert tone="danger">{result.error}</Alert> : <SettingsForm defaults={result.data} />}
    </div>
  );
}
