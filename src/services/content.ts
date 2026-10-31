import "server-only";
import { SEED_FAQS, type Faq } from "@/data/faqs";
import { DEFAULT_THRESHOLDS, type WeatherThresholds } from "@/domain/weather";
import { getPublicSupabase } from "@/lib/supabase/server";

export async function getFaqs(): Promise<Faq[]> {
  const supabase = getPublicSupabase();
  if (!supabase) return SEED_FAQS;
  const { data, error } = await supabase
    .from("faqs")
    .select("id, question, answer")
    .eq("is_published", true)
    .order("sort_order");
  if (error) {
    console.error("[faqs] load failed:", error.message);
    return SEED_FAQS;
  }
  return data as Faq[];
}

async function getSetting<T>(key: string): Promise<T | null> {
  const supabase = getPublicSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
  if (error) {
    console.error(`[settings] ${key} load failed:`, error.message);
    return null;
  }
  return (data?.value as T) ?? null;
}

export async function getWeatherThresholds(): Promise<WeatherThresholds> {
  const value = await getSetting<Partial<WeatherThresholds>>("weather_thresholds");
  return { ...DEFAULT_THRESHOLDS, ...(value ?? {}) };
}

export async function getContactEmail(): Promise<string> {
  const value = await getSetting<{ email?: string }>("contact");
  return value?.email ?? "";
}

/** Admin-edited climate zones per region (falls back to the bundled defaults). */
export async function getRegionZoneOverrides(): Promise<Record<string, string>> {
  const supabase = getPublicSupabase();
  if (!supabase) return {};
  const { data, error } = await supabase.from("regions").select("id, zone");
  if (error || !data) return {};
  return Object.fromEntries(data.map((r) => [r.id as string, r.zone as string]));
}
