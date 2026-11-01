/**
 * Public build-time configuration. Only NEXT_PUBLIC_* values exist here; they
 * are embedded in the static bundle, so never put a secret in them. The
 * Supabase publishable (anon) key is public by design — data is protected by
 * Row Level Security in the database.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

/** Sub-path the site is served from ("" locally, "/smartplant-calendar" on GitHub Pages). */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

/** Full public URL of the site root, including the base path, without trailing slash. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? `http://localhost:3000${BASE_PATH}`).replace(/\/$/, "");

/**
 * Private deployment (Cloudflare Pages behind Cloudflare Access): tells search
 * engines not to index anything. Real protection is Access, not this flag.
 */
export const IS_PRIVATE_SITE = process.env.NEXT_PUBLIC_PRIVATE_SITE === "1";

export const SITE_NAME = "رزنامة الزراعة الذكية";
export const SITE_DESCRIPTION =
  "منصة عربية تساعدك على معرفة ماذا تزرع ومتى، وتنظّم الري والتسميد والحصاد في رزنامة واحدة وفق منطقتك وموسمك.";

/** Absolute URL for SEO metadata (canonical, sitemap, Open Graph). */
export function absoluteUrl(path = "/"): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p === "/" ? "/" : p.endsWith("/") ? p : `${p}/`}`;
}

/**
 * Browser URL for a route inside this site (for places Next's <Link> and
 * router do not cover: auth email redirects, manifest, plain <a> tags).
 */
export function appUrl(path: string): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${BASE_PATH}${p}`;
}
