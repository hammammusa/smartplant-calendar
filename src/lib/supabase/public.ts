import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, SUPABASE_KEY, SUPABASE_URL } from "@/lib/env";

/**
 * Cookie-less anonymous client used at build time to read public content
 * (crops, FAQs, settings) into the static pages. Row Level Security limits it
 * to published, public rows.
 */
export function getPublicSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
