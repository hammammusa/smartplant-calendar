import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { updateSession } from "@/lib/supabase/proxy-session";

/**
 * Keeps the Supabase session fresh and performs an optimistic redirect for
 * signed-out visitors on account-only pages. Real authorisation happens in
 * server code and in the database (RLS) — this is only a UX shortcut.
 */
export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.next();
  const { response, user } = await updateSession(request);
  const path = request.nextUrl.pathname;
  if (!user && (path.startsWith("/profile") || path.startsWith("/admin"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|webp|woff2?)$).*)"],
};
