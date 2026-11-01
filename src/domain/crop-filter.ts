import { searchCrops } from "./crop-search";
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

export { normalizeArabic } from "./crop-search";

/** Text search (ranked, typo-tolerant) followed by the structured filters. */
export function filterCrops(crops: Crop[], filters: CropFilters): Crop[] {
  const base = filters.query?.trim() ? searchCrops(crops, filters.query) : crops;
  return base.filter((crop) => {
    if (filters.category && crop.category !== filters.category) return false;
    if (filters.difficulty && crop.difficulty !== filters.difficulty) return false;
    if (filters.space && !crop.spaceTypes.includes(filters.space)) return false;
    if (filters.season && !cropMatchesSeason(crop, filters.season, filters.zone || undefined)) return false;
    return true;
  });
}
