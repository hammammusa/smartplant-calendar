"use server";

/**
 * Admin server actions. Authorisation is enforced twice:
 *   1. here, by verifying the session and the admin role on the server;
 *   2. in PostgreSQL, where RLS only lets is_admin() write content tables.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  adminCropRulesSchema,
  adminCropSchema,
  adminFaqSchema,
  adminRegionSchema,
  adminSettingsSchema,
  uuidSchema,
} from "@/domain/schemas";
import { getServerSupabase } from "@/lib/supabase/server";
import type { ActionResult } from "./user-data";

const FORBIDDEN = "لا تملك صلاحية تنفيذ هذه العملية.";
const GENERIC = "تعذّر حفظ التغييرات. حاول مرة أخرى.";

async function adminCtx() {
  const supabase = await getServerSupabase();
  if (!supabase) return { error: "قاعدة البيانات غير مهيأة." } as const;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "انتهت جلستك. سجّل الدخول مرة أخرى." } as const;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  if (profile?.role !== "admin") return { error: FORBIDDEN } as const;
  return { supabase, user: data.user } as const;
}

function issue(err: z.ZodError) {
  const i = err.issues[0];
  return i ? i.message : "البيانات غير صالحة.";
}

function fail(scope: string, message: string, code?: string): { ok: false; error: string } {
  console.error(`[admin:${scope}]`, code, message);
  if (code === "23505") return { ok: false, error: "القيمة مستخدمة مسبقًا (مثل معرّف المحصول)." };
  if (code === "42501") return { ok: false, error: FORBIDDEN };
  return { ok: false, error: GENERIC };
}

function revalidateContent(slug?: string) {
  revalidatePath("/");
  revalidatePath("/crops");
  revalidatePath("/planner");
  if (slug) revalidatePath(`/crops/${slug}`);
}

export async function saveCropAction(id: string | null, raw: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = adminCropSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: issue(parsed.error) };
  if (id && !uuidSchema.safeParse(id).success) return { ok: false, error: "المحصول غير موجود." };
  const ctx = await adminCtx();
  if ("error" in ctx) return { ok: false, error: ctx.error ?? FORBIDDEN };
  const v = parsed.data;
  const row = {
    slug: v.slug,
    name: v.name,
    other_names: v.otherNames,
    scientific_name: v.scientificName || null,
    category: v.category,
    life_cycle: v.lifeCycle,
    difficulty: v.difficulty,
    sun: v.sun,
    water: v.water,
    space_types: v.spaceTypes,
    growth_days_min: v.growthDaysMin,
    growth_days_max: v.growthDaysMax,
    growth_note: v.growthNote || null,
    summary: v.summary,
    watering_summary: v.wateringSummary || null,
    image_url: v.imageUrl || null,
    image_alt: v.imageAlt || null,
    data_status: v.dataStatus,
    source_note: v.sourceNote || null,
    is_published: v.isPublished,
    updated_by: ctx.user.id,
  };
  const q = id
    ? ctx.supabase.from("crops").update(row).eq("id", id).select("id").single()
    : ctx.supabase.from("crops").insert(row).select("id").single();
  const { data, error } = await q;
  if (error) return fail("crop:save", error.message, error.code);
  revalidateContent(v.slug);
  return { ok: true, data: { id: data.id as string } };
}

/** Replaces a crop's planting windows, task rules and guide sections. */
export async function saveCropRulesAction(cropId: string, raw: unknown): Promise<ActionResult<null>> {
  if (!uuidSchema.safeParse(cropId).success) return { ok: false, error: "المحصول غير موجود." };
  const parsed = adminCropRulesSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: issue(parsed.error) };
  const keys = parsed.data.templates.map((t) => t.key);
  if (new Set(keys).size !== keys.length) return { ok: false, error: "مفاتيح قواعد المهام يجب ألا تتكرر." };
  const ctx = await adminCtx();
  if ("error" in ctx) return { ok: false, error: ctx.error ?? FORBIDDEN };
  const { supabase } = ctx;
  const v = parsed.data;

  for (const table of ["crop_planting_windows", "crop_task_templates", "crop_guides"] as const) {
    const { error } = await supabase.from(table).delete().eq("crop_id", cropId);
    if (error) return fail(`rules:clear:${table}`, error.message, error.code);
  }
  if (v.windows.length) {
    const { error } = await supabase.from("crop_planting_windows").insert(
      v.windows.map((w, i) => ({ crop_id: cropId, zone: w.zone, start_month: w.startMonth, end_month: w.endMonth, method: w.method, note: w.note || null, sort_order: i })),
    );
    if (error) return fail("rules:windows", error.message, error.code);
  }
  if (v.templates.length) {
    const { error } = await supabase.from("crop_task_templates").insert(
      v.templates.map((t, i) => ({
        crop_id: cropId,
        key: t.key,
        type: t.type,
        title: t.title,
        description: t.description,
        offset_days: t.offsetDays,
        repeat_every_days: t.repeatEveryDays,
        until_offset_days: t.repeatEveryDays ? t.untilOffsetDays : null,
        active_months: t.activeMonths,
        sort_order: i,
      })),
    );
    if (error) return fail("rules:templates", error.message, error.code);
  }
  if (v.guide.length) {
    const { error } = await supabase
      .from("crop_guides")
      .insert(v.guide.map((g, i) => ({ crop_id: cropId, section: g.section, title: g.title, body: g.body, sort_order: i })));
    if (error) return fail("rules:guide", error.message, error.code);
  }
  const { data: crop } = await supabase.from("crops").select("slug").eq("id", cropId).maybeSingle();
  revalidateContent(crop?.slug as string | undefined);
  return { ok: true, data: null };
}

export async function deleteCropAction(id: string): Promise<ActionResult<null>> {
  if (!uuidSchema.safeParse(id).success) return { ok: false, error: "المحصول غير موجود." };
  const ctx = await adminCtx();
  if ("error" in ctx) return { ok: false, error: ctx.error ?? FORBIDDEN };
  const { error } = await ctx.supabase.from("crops").delete().eq("id", id);
  if (error) return fail("crop:delete", error.message, error.code);
  revalidateContent();
  return { ok: true, data: null };
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function uploadCropImageAction(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const file = formData.get("file");
  const slug = String(formData.get("slug") ?? "");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "اختر صورة لرفعها." };
  if (!/^[a-z0-9-]{2,60}$/.test(slug)) return { ok: false, error: "احفظ معرّف المحصول أولًا." };
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return { ok: false, error: "الصيغ المسموحة: JPG أو PNG أو WebP." };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "حجم الصورة يجب ألا يتجاوز 5 ميغابايت." };
  const ctx = await adminCtx();
  if ("error" in ctx) return { ok: false, error: ctx.error ?? FORBIDDEN };
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${slug}/${Date.now()}.${ext}`;
  const { error } = await ctx.supabase.storage.from("crop-images").upload(path, file, { contentType: file.type, upsert: false });
  if (error) return fail("image:upload", error.message);
  const { data } = ctx.supabase.storage.from("crop-images").getPublicUrl(path);
  return { ok: true, data: { url: data.publicUrl } };
}

export async function saveFaqAction(id: string | null, raw: unknown): Promise<ActionResult<null>> {
  const parsed = adminFaqSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: issue(parsed.error) };
  if (id && !uuidSchema.safeParse(id).success) return { ok: false, error: "السؤال غير موجود." };
  const ctx = await adminCtx();
  if ("error" in ctx) return { ok: false, error: ctx.error ?? FORBIDDEN };
  const v = parsed.data;
  const row = { question: v.question, answer: v.answer, sort_order: v.sortOrder, is_published: v.isPublished };
  const { error } = id ? await ctx.supabase.from("faqs").update(row).eq("id", id) : await ctx.supabase.from("faqs").insert(row);
  if (error) return fail("faq:save", error.message, error.code);
  revalidatePath("/");
  return { ok: true, data: null };
}

export async function deleteFaqAction(id: string): Promise<ActionResult<null>> {
  if (!uuidSchema.safeParse(id).success) return { ok: false, error: "السؤال غير موجود." };
  const ctx = await adminCtx();
  if ("error" in ctx) return { ok: false, error: ctx.error ?? FORBIDDEN };
  const { error } = await ctx.supabase.from("faqs").delete().eq("id", id);
  if (error) return fail("faq:delete", error.message, error.code);
  revalidatePath("/");
  return { ok: true, data: null };
}

export async function saveSettingsAction(raw: unknown): Promise<ActionResult<null>> {
  const parsed = adminSettingsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: issue(parsed.error) };
  const ctx = await adminCtx();
  if ("error" in ctx) return { ok: false, error: ctx.error ?? FORBIDDEN };
  const { contactEmail, ...thresholds } = parsed.data;
  const { error } = await ctx.supabase.from("site_settings").upsert([
    { key: "weather_thresholds", value: thresholds, updated_by: ctx.user.id, updated_at: new Date().toISOString() },
    { key: "contact", value: { email: contactEmail }, updated_by: ctx.user.id, updated_at: new Date().toISOString() },
  ]);
  if (error) return fail("settings:save", error.message, error.code);
  revalidatePath("/weather");
  revalidatePath("/contact");
  return { ok: true, data: null };
}

export async function updateRegionZoneAction(raw: unknown): Promise<ActionResult<null>> {
  const parsed = adminRegionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: issue(parsed.error) };
  const ctx = await adminCtx();
  if ("error" in ctx) return { ok: false, error: ctx.error ?? FORBIDDEN };
  const { error } = await ctx.supabase.from("regions").update({ zone: parsed.data.zone }).eq("id", parsed.data.id);
  if (error) return fail("region:update", error.message, error.code);
  return { ok: true, data: null };
}
