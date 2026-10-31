import type { MetadataRoute } from "next";
import { BASE_PATH, SITE_URL } from "@/lib/env";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const p = (path: string) => `${BASE_PATH}${path}`;
  return {
    rules: [
      {
        userAgent: "*",
        allow: p("/"),
        disallow: ["/admin/", "/auth/", "/profile/", "/dashboard/", "/calendar/", "/tasks/"].map(p),
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
