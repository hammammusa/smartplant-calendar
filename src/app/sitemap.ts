import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/env";
import { getCrops } from "@/services/crops";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { crops } = await getCrops();
  const now = new Date();
  const pages = ["/", "/crops", "/planner", "/weather", "/contact", "/privacy", "/terms"].map((p) => ({
    url: absoluteUrl(p),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: p === "/" ? 1 : 0.7,
  }));
  return [
    ...pages,
    ...crops.map((c) => ({ url: absoluteUrl(`/crops/${c.slug}`), lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
