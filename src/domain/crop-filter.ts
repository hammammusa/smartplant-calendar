import { cropMatchesSeason } from "./planting-windows";
import type { ClimateZone, Crop, CropCategory, Difficulty, Season, SpaceType } from "./types";

export interface CropFilters {
  query?: string;
  season?: Season | "";
  category?: CropCategory | "";
  space?: SpaceType | "";
  difficulty?: Difficulty | "";
  zone?: ClimateZone | "";
}

/**
 * Normalises Arabic text for forgiving search: strips diacritics and tatweel,
 * unifies alef/hamza forms, taa marbuta and alef maqsura, and the definite
 * article so "بندورة" matches "البندورة".
 */
export function normalizeArabic(input: string): string {
  return input
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/(^|\s)ال/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function filterCrops(crops: Crop[], filters: CropFilters): Crop[] {
  const q = filters.query ? normalizeArabic(filters.query) : "";
  return crops.filter((crop) => {
    if (q) {
      const haystack = normalizeArabic(
        [crop.name, ...(crop.otherNames ?? []), crop.scientificName ?? ""].join(" "),
      );
      if (!haystack.includes(q)) return false;
    }
    if (filters.category && crop.category !== filters.category) return false;
    if (filters.difficulty && crop.difficulty !== filters.difficulty) return false;
    if (filters.space && !crop.spaceTypes.includes(filters.space)) return false;
    if (filters.season && !cropMatchesSeason(crop, filters.season, filters.zone || undefined)) return false;
    return true;
  });
}
