import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/env";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "رزنامة الزراعة",
    description: SITE_DESCRIPTION,
    lang: "ar",
    dir: "rtl",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f7faf5",
    theme_color: "#166534",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
