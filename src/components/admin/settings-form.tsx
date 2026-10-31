"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { saveSettingsAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/form-controls";
import { adminSettingsSchema } from "@/domain/schemas";

type V = z.infer<typeof adminSettingsSchema>;

export function SettingsForm({ defaults }: { defaults: V }) {
  const form = useForm<V>({ resolver: zodResolver(adminSettingsSchema), defaultValues: defaults });
  const { errors, isSubmitting } = form.formState;
  const num = { valueAsNumber: true } as const;
  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={form.handleSubmit(async (v) => {
        const res = await saveSettingsAction(v);
        if (res.ok) toast.success("تم حفظ الإعدادات");
        else toast.error(res.error);
      })}
    >
      <Card>
        <CardHeader>
          <CardTitle>حدود تنبيهات الطقس الزراعية</CardTitle>
          <CardDescription>تُستخدم لإظهار تنبيهات الصقيع والحرارة والأمطار والرياح لجميع المستخدمين.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="الصقيع: الصغرى أقل من أو تساوي (°م)" htmlFor="frost" error={errors.frostTempC?.message}><Input id="frost" type="number" step="0.5" {...form.register("frostTempC", num)} /></Field>
          <Field label="الحرارة المرتفعة: العظمى من (°م)" htmlFor="heat" error={errors.heatTempC?.message}><Input id="heat" type="number" step="0.5" {...form.register("heatTempC", num)} /></Field>
          <Field label="احتمال الأمطار من (٪)" htmlFor="rain" error={errors.rainProbabilityPct?.message}><Input id="rain" type="number" {...form.register("rainProbabilityPct", num)} /></Field>
          <Field label="أمطار غزيرة من (ملم/يوم)" htmlFor="heavy" error={errors.heavyRainMm?.message}><Input id="heavy" type="number" {...form.register("heavyRainMm", num)} /></Field>
          <Field label="رياح قوية من (كم/س)" htmlFor="wind" error={errors.strongWindKmh?.message}><Input id="wind" type="number" {...form.register("strongWindKmh", num)} /></Field>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>التواصل</CardTitle>
          <CardDescription>يظهر في صفحة «تواصل معنا». اتركه فارغًا لإخفائه.</CardDescription>
        </CardHeader>
        <CardContent>
          <Field label="بريد التواصل" htmlFor="contactEmail" error={errors.contactEmail?.message}>
            <Input id="contactEmail" type="email" dir="ltr" {...form.register("contactEmail")} />
          </Field>
        </CardContent>
      </Card>
      <Button type="submit" className="self-start" disabled={isSubmitting}>{isSubmitting ? <Spinner /> : <Save />} حفظ الإعدادات</Button>
    </form>
  );
}
