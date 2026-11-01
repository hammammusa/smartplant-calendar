/**
 * Core domain types shared by the UI, the plan generator, the local (guest)
 * store and the Supabase repository. Keep these free of framework imports so
 * they can be unit-tested in isolation.
 */

/** Calendar date without time, always formatted as `YYYY-MM-DD`. */
export type ISODate = string;

export const CLIMATE_ZONES = [
  "coastal",
  "highland",
  "inland_plain",
  "jordan_valley",
  "arid",
] as const;
export type ClimateZone = (typeof CLIMATE_ZONES)[number];

export const SPACE_TYPES = [
  "home_garden",
  "rooftop",
  "balcony",
  "containers",
  "small_plot",
  "farm",
  "greenhouse",
] as const;
export type SpaceType = (typeof SPACE_TYPES)[number];

export const CROP_CATEGORIES = [
  "fruiting_vegetable",
  "leafy_vegetable",
  "root_tuber",
  "bulb",
  "herb",
  "fruit",
  "tree",
] as const;
export type CropCategory = (typeof CROP_CATEGORIES)[number];

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const SUN_REQUIREMENTS = ["full_sun", "partial_sun", "shade_tolerant"] as const;
export type SunRequirement = (typeof SUN_REQUIREMENTS)[number];

export const WATER_NEEDS = ["low", "moderate", "high"] as const;
export type WaterNeed = (typeof WATER_NEEDS)[number];

export const LIFE_CYCLES = ["annual", "perennial"] as const;
export type LifeCycle = (typeof LIFE_CYCLES)[number];

export const PLANTING_METHODS = [
  "direct_sowing",
  "transplanting",
  "tubers",
  "cloves",
  "cuttings",
  "saplings",
] as const;
export type PlantingMethod = (typeof PLANTING_METHODS)[number];

export const SEASONS = ["winter", "spring", "summer", "autumn"] as const;
export type Season = (typeof SEASONS)[number];

/** `preliminary` = general seed data, not yet reviewed by an agronomist. */
export const DATA_STATUSES = ["preliminary", "reviewed"] as const;
export type DataStatus = (typeof DATA_STATUSES)[number];

export const TASK_TYPES = [
  "soil_prep",
  "planting",
  "irrigation",
  "fertilizing",
  "care",
  "pest_check",
  "harvest",
  "custom",
] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const TASK_STATUSES = ["pending", "done", "skipped"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const PLANTING_STATUSES = ["active", "harvested", "archived"] as const;
export type PlantingStatus = (typeof PLANTING_STATUSES)[number];

export const GUIDE_SECTIONS = [
  "overview",
  "planting",
  "care",
  "irrigation",
  "fertilization",
  "harvest",
  "problems",
] as const;
export type GuideSection = (typeof GUIDE_SECTIONS)[number];

export interface PlantingWindow {
  zone: ClimateZone;
  /** 1–12. A window may wrap the year end (e.g. 10 → 2). */
  startMonth: number;
  endMonth: number;
  method: PlantingMethod;
  note?: string;
}

/**
 * A rule the plan generator expands into dated tasks. Offsets are measured in
 * days from the planting date (negative = before planting).
 */
export interface TaskTemplate {
  key: string;
  type: TaskType;
  title: string;
  description: string;
  offsetDays: number;
  /** When set, the task repeats every N days until `untilOffsetDays`. */
  repeatEveryDays?: number;
  untilOffsetDays?: number;
  /** Optional month filter (1–12): occurrences outside these months are skipped. */
  activeMonths?: number[];
}

export interface CropGuideEntry {
  section: GuideSection;
  title: string;
  body: string;
}

export interface Crop {
  id: string;
  slug: string;
  name: string;
  otherNames?: string[];
  scientificName?: string;
  category: CropCategory;
  lifeCycle: LifeCycle;
  difficulty: Difficulty;
  sun: SunRequirement;
  water: WaterNeed;
  spaceTypes: SpaceType[];
  /**
   * Damaged by frost (warm-season crops). Drives frost warnings in
   * recommendations; false means "no specific frost rule", not "frost-proof".
   */
  frostSensitive: boolean;
  /** Approximate days from planting to first harvest, null when unreliable. */
  growthDaysMin: number | null;
  growthDaysMax: number | null;
  growthNote?: string;
  summary: string;
  wateringSummary: string;
  imageUrl?: string | null;
  imageAlt?: string;
  dataStatus: DataStatus;
  sourceNote: string;
  windows: PlantingWindow[];
  templates: TaskTemplate[];
  guide: CropGuideEntry[];
}

export interface Country {
  code: string;
  name: string;
}

export interface Region {
  id: string;
  countryCode: string;
  name: string;
  zone: ClimateZone;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface Garden {
  id: string;
  name: string;
  spaceType: SpaceType;
  regionId: string | null;
  zone: ClimateZone;
  areaM2: number | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
}

export interface Planting {
  id: string;
  gardenId: string;
  cropId: string;
  cropSlug: string;
  cropName: string;
  plantedOn: ISODate;
  method: PlantingMethod | null;
  areaM2: number | null;
  quantity: number | null;
  status: PlantingStatus;
  expectedHarvestStart: ISODate | null;
  expectedHarvestEnd: ISODate | null;
  notes: string | null;
  createdAt: string;
}

export interface Task {
  id: string;
  plantingId: string | null;
  gardenId: string | null;
  type: TaskType;
  title: string;
  description: string | null;
  dueDate: ISODate;
  status: TaskStatus;
  completedAt: string | null;
  postponedCount: number;
  source: "generated" | "custom";
  createdAt: string;
}

export interface UserDataSnapshot {
  gardens: Garden[];
  plantings: Planting[];
  tasks: Task[];
}
