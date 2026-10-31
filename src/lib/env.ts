/**
 * Public runtime configuration. Only NEXT_PUBLIC_* values are read here, so
 * this module is safe on both server and client. No secret keys are needed:
 * all database access goes through the user's session and Row Level Security.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const SITE_NAME = "رزنامة الزراعة الذكية";
export const SITE_DESCRIPTION =
  "منصة عربية تساعدك على معرفة ماذا تزرع ومتى، وتنظّم الري والتسميد والحصاد في رزنامة واحدة وفق منطقتك وموسمك.";
