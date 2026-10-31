import "server-only";
import { SEED_CROPS } from "@/data/crops";
import type { Crop } from "@/domain/types";
import { getPublicSupabase } from "@/lib/supabase/server";
import { CROP_SELECT, mapCropRow, type CropRow } from "./crop-mapper";

export interface CropCatalogue {
  crops: Crop[];
  source: "database" | "seed";
}

/**
 * Published crops. Uses the database when Supabase is configured, otherwise
 * the bundled preliminary seed data. On a database error the seed data is
 * used so the public guide keeps working, and the error is logged.
 */
export async function getCrops(): Promise<CropCatalogue> {
  const supabase = getPublicSupabase();
  if (!supabase) return { crops: SEED_CROPS, source: "seed" };
  const { data, error } = await supabase
    .from("crops")
    .select(CROP_SELECT)
    .eq("is_published", true)
    .order("name");
  if (error) {
    console.error("[crops] failed to load from database, using seed data:", error.message);
    return { crops: SEED_CROPS, source: "seed" };
  }
  return { crops: (data as CropRow[]).map(mapCropRow), source: "database" };
}

export async function getCropBySlug(slug: string): Promise<Crop | null> {
  const { crops } = await getCrops();
  return crops.find((c) => c.slug === slug) ?? null;
}
