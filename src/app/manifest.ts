import type { MetadataRoute } from "next";
import { BASE_PATH, SITE_DESCRIPTION, SITE_NAME } from "@/lib/env";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "رزنامة الزراعة",
    description: SITE_DESCRIPTION,
    lang: "ar",
    dir: "rtl",
    start_url: `${BASE_PATH}/dashboard/`,
    scope: `${BASE_PATH}/`,
    display: "standalone",
    background_color: "#f7faf5",
    theme_color: "#166534",
    icons: [{ src: `${BASE_PATH}/icon.svg`, sizes: "any", type: "image/svg+xml" }],
  };
}
