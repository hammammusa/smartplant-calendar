"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { getProfileAction, updateNotificationPrefsAction, updateProfileAction, type ProfileData } from "@/data-access/user-data";
import { useAppData } from "@/components/providers/app-data-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, EmptyState, Spinner } from "@/components/ui/feedback";
import { Checkbox, Field, Input, Select } from "@/components/ui/form-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { COUNTRIES, findRegion, REGIONS } from "@/data/regions";
import { CLIMATE_ZONE_LABELS } from "@/domain/labels";
import { CLIMATE_ZONES, type ClimateZone } from "@/domain/types";
import { isSupabaseConfigured } from "@/lib/env";

const TIMEZONES = [
  { id: "Asia/Hebron", label: "فلسطين — الخليل/الضفة (Asia/Hebron)" },
  { id: "Asia/Gaza", label: "فلسطين — غزة (Asia/Gaza)" },
  { id: "Asia/Jerusalem", label: "القدس (Asia/Jerusalem)" },
  { id: "Asia/Amman", label: "الأردن (Asia/Amman)" },
  { id: "Asia/Beirut", label: "لبنان (Asia/Beirut)" },
  { id: "Asia/Damascus", label: "سوريا (Asia/Damascus)" },
];

const formSchema = z.object({
  fullName: z.string().trim().min(2, { error: "الاسم قصير جدًا" }).max(80, { error: "الاسم طويل جدًا" }),
  regionId: z.string(),
  zone: z.string(),
  timezone: z.string(),
});
type FormValues = z.infer<typeof formSchema>;

export function ProfileView() {
  const app = useAppData();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState({ inAppEnabled: true, reminderDaysBefore: 1 });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const form = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: { fullName: "", regionId: "", zone: "", timezone: "Asia/Hebron" } });
  const regionId = useWatch({ control: form.control, name: "regionId" });

  useEffect(() => {
    if (app.mode !== "remote") return;
    let cancelled = false;
    getProfileAction().then((res) => {
      if (cancelled) return;
      if (!res.ok) return setLoadError(res.error);
      setProfile(res.data);
      setPrefs({ inAppEnabled: res.data.prefs.inAppEnabled, reminderDaysBefore: res.data.prefs.reminderDaysBefore });
      form.reset({ fullName: res.data.fullName, regionId: res.data.regionId ?? "", zone: res.data.zone ?? "", timezone: res.data.timezone });
    });
    return () => {
      cancelled = true;
    };
  }, [app.mode, form]);

  if (app.mode === "loading") return <Skeleton className="h-96 w-full rounded-2xl" />;

  if (app.mode === "local") {
    return (
      <EmptyState
        icon={UserRound}
        title={isSupabaseConfigured ? "سجّل الدخول لعرض ملفك الشخصي" : "الملف الشخصي غير متاح في وضع المعاينة"}
        description={
          isSupabaseConfigured
            ? "الملف الشخصي وحفظ الموقع المفضل وإعدادات التنبيهات متاحة لأصحاب الحسابات."
            : "قاعدة البيانات غير مهيأة بعد، لذلك لا توجد حسابات. يمكنك اختيار موقعك من صفحة الطقس أو مولّد الخطط ويُحفظ في هذا المتصفح."
        }
        action={
          isSupabaseConfigured ? (
            <div className="flex gap-2">
              <Button asChild><Link href="/auth/login?next=/profile">تسجيل الدخول</Link></Button>
              <Button asChild variant="outline"><Link href="/auth/register">إنشاء حساب</Link></Button>
            </div>
          ) : (
            <Button asChild variant="outline"><Link href="/weather">اختيار الموقع</Link></Button>
          )
        }
      />
    );
  }

  if (loadError) return <Alert tone="danger">{loadError}</Alert>;
  if (!profile) return <Skeleton className="h-96 w-full rounded-2xl" />;

  const { errors, isSubmitting } = form.formState;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>البيانات الشخصية والموقع المفضل</CardTitle>
          <CardDescription>نستخدم موقعك المفضل للطقس ولاقتراح المنطقة المناخية في خططك الجديدة.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            noValidate
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={form.handleSubmit(async (v) => {
              const region = findRegion(v.regionId);
              const payload = {
                fullName: v.fullName,
                regionId: region?.id ?? null,
                zone: (v.zone || region?.zone || null) as ClimateZone | null,
                timezone: v.timezone,
                latitude: region?.latitude ?? null,
                longitude: region?.longitude ?? null,
              };
              const res = await updateProfileAction(payload);
              if (!res.ok) return void toast.error(res.error);
              if (region) {
                app.setLocation({ regionId: region.id, zone: payload.zone, latitude: region.latitude, longitude: region.longitude, timezone: v.timezone });
              }
              toast.success("تم حفظ ملفك الشخصي");
            })}
          >
            <Field label="الاسم" htmlFor="fullName" error={errors.fullName?.message} className="sm:col-span-2">
              <Input id="fullName" aria-invalid={!!errors.fullName} {...form.register("fullName")} />
            </Field>
            <Field label="البريد الإلكتروني" htmlFor="email" className="sm:col-span-2" hint="لا يمكن تغييره من هنا حاليًا.">
              <Input id="email" value={profile.email ?? ""} dir="ltr" readOnly disabled />
            </Field>
            <Field label="المدينة" htmlFor="regionId">
              <Select
                id="regionId"
                {...form.register("regionId", {
                  onChange: (e) => {
                    const r = findRegion(e.target.value);
                    if (r) {
                      form.setValue("zone", r.zone);
                      form.setValue("timezone", r.timezone);
                    }
                  },
                })}
              >
                <option value="">لم تُحدد</option>
                {COUNTRIES.map((c) => (
                  <optgroup key={c.code} label={c.name}>
                    {REGIONS.filter((r) => r.countryCode === c.code).map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </Field>
            <Field label="المنطقة المناخية" htmlFor="zone" hint={regionId ? undefined : "اختر المدينة أولًا"}>
              <Select id="zone" {...form.register("zone")}>
                <option value="">تلقائي حسب المدينة</option>
                {CLIMATE_ZONES.map((z) => (
                  <option key={z} value={z}>{CLIMATE_ZONE_LABELS[z]}</option>
                ))}
              </Select>
            </Field>
            <Field label="المنطقة الزمنية" htmlFor="timezone" className="sm:col-span-2">
              <Select id="timezone" {...form.register("timezone")}>
                {TIMEZONES.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Spinner /> : null} حفظ التغييرات</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>التنبيهات</CardTitle>
            <CardDescription>تذكيرات المهام القريبة والمتأخرة داخل المنصة.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <label className="flex items-center gap-3 text-sm">
              <Checkbox checked={prefs.inAppEnabled} onChange={(e) => setPrefs((p) => ({ ...p, inAppEnabled: e.target.checked }))} />
              التنبيهات داخل المنصة
            </label>
            <Field label="التذكير قبل موعد المهمة بـ" htmlFor="days">
              <Select id="days" value={prefs.reminderDaysBefore} onChange={(e) => setPrefs((p) => ({ ...p, reminderDaysBefore: Number(e.target.value) }))}>
                {[0, 1, 2, 3, 7].map((d) => (
                  <option key={d} value={d}>{d === 0 ? "في يوم المهمة نفسه" : d === 1 ? "يوم واحد" : d === 2 ? "يومين" : d === 7 ? "أسبوع" : `${d} أيام`}</option>
                ))}
              </Select>
            </Field>
            <div className="space-y-2 rounded-xl bg-surface-muted p-3 text-sm">
              <p className="flex items-center justify-between">البريد الإلكتروني <Badge variant="neutral">غير متاح حاليًا</Badge></p>
              <p className="flex items-center justify-between">الإشعارات الفورية <Badge variant="neutral">غير متاح حاليًا</Badge></p>
              <p className="text-xs leading-6 text-subtle-foreground">لن نفعّل هذه القنوات قبل ربط خدمة إرسال حقيقية واختبارها.</p>
            </div>
            <Button
              variant="outline"
              disabled={savingPrefs}
              onClick={async () => {
                setSavingPrefs(true);
                const res = await updateNotificationPrefsAction(prefs);
                setSavingPrefs(false);
                if (res.ok) toast.success("تم حفظ إعدادات التنبيهات");
                else toast.error(res.error);
              }}
            >
              {savingPrefs ? <Spinner /> : null} حفظ إعدادات التنبيهات
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الحساب</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p className="flex items-center justify-between">الخطة <Badge>{profile.planTier === "free" ? "مجانية" : profile.planTier === "premium" ? "مميزة" : "مؤسسات"}</Badge></p>
            <p className="flex items-center justify-between">الصلاحية <Badge variant="outline">{profile.role === "admin" ? "مشرف" : "مستخدم"}</Badge></p>
            <Button
              variant="danger-ghost"
              className="justify-start"
              onClick={async () => {
                await app.signOut();
                router.push("/");
                router.refresh();
              }}
            >
              <LogOut /> تسجيل الخروج
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
