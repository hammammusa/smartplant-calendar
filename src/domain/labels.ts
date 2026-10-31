import type {
  ClimateZone,
  CropCategory,
  DataStatus,
  Difficulty,
  GuideSection,
  LifeCycle,
  PlantingMethod,
  PlantingStatus,
  Season,
  SpaceType,
  SunRequirement,
  TaskStatus,
  TaskType,
  WaterNeed,
} from "./types";

export const CLIMATE_ZONE_LABELS: Record<ClimateZone, string> = {
  coastal: "ساحلي",
  highland: "جبلي / مرتفعات",
  inland_plain: "سهلي داخلي",
  jordan_valley: "غور / منخفض حار",
  arid: "صحراوي / شبه جاف",
};

export const CLIMATE_ZONE_DESCRIPTIONS: Record<ClimateZone, string> = {
  coastal: "شتاء معتدل نادر الصقيع وصيف رطب، مثل غزة ويافا وحيفا وبيروت.",
  highland: "شتاء بارد قد يشهد صقيعًا وثلوجًا أحيانًا وصيف معتدل، مثل الخليل والقدس ونابلس وعمّان.",
  inland_plain: "سهول داخلية متوسطة الارتفاع، أدفأ من الجبال وأبرد من الساحل شتاءً، مثل جنين وطولكرم.",
  jordan_valley: "منطقة منخفضة شديدة الحرارة صيفًا ودافئة شتاءً، مثل أريحا والأغوار؛ موسمها الرئيسي في الخريف والشتاء.",
  arid: "أمطار قليلة وحرارة مرتفعة وتبخر عالٍ، مثل النقب والعقبة؛ تحتاج الزراعة فيها إلى ري منتظم وحماية.",
};

export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  home_garden: "حديقة منزلية",
  rooftop: "سطح منزل",
  balcony: "شرفة",
  containers: "أصص زراعية",
  small_plot: "قطعة أرض صغيرة",
  farm: "مزرعة",
};

export const SPACE_TYPE_DESCRIPTIONS: Record<SpaceType, string> = {
  home_garden: "تربة أرضية بجانب المنزل",
  rooftop: "أحواض أو أكياس زراعة على السطح",
  balcony: "مساحة محدودة وإضاءة متفاوتة",
  containers: "أوعية متنقلة بأحجام مختلفة",
  small_plot: "أرض مكشوفة حتى بضع مئات من الأمتار",
  farm: "مساحات إنتاجية أوسع",
};

/** Spaces where plants grow in containers and soil dries faster. */
export const CONTAINER_SPACES: SpaceType[] = ["rooftop", "balcony", "containers"];

export const CATEGORY_LABELS: Record<CropCategory, string> = {
  fruiting_vegetable: "خضار ثمرية",
  leafy_vegetable: "خضار ورقية",
  root_tuber: "درنات وجذور",
  bulb: "أبصال",
  herb: "أعشاب عطرية",
  fruit: "فواكه",
  tree: "أشجار مثمرة",
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "سهل",
  medium: "متوسط",
  hard: "متقدم",
};

export const SUN_LABELS: Record<SunRequirement, string> = {
  full_sun: "شمس كاملة",
  partial_sun: "شمس جزئية",
  shade_tolerant: "يتحمل الظل",
};

export const WATER_LABELS: Record<WaterNeed, string> = {
  low: "منخفضة",
  moderate: "متوسطة",
  high: "مرتفعة",
};

export const LIFE_CYCLE_LABELS: Record<LifeCycle, string> = {
  annual: "موسمي",
  perennial: "معمّر",
};

export const METHOD_LABELS: Record<PlantingMethod, string> = {
  direct_sowing: "بذر مباشر",
  transplanting: "شتل",
  tubers: "زراعة درنات",
  cloves: "زراعة فصوص",
  cuttings: "عُقَل أو جذامير",
  saplings: "غراس",
};

export const SEASON_LABELS: Record<Season, string> = {
  winter: "الشتاء",
  spring: "الربيع",
  summer: "الصيف",
  autumn: "الخريف",
};

/** Months that belong to each season in the Levant. */
export const SEASON_MONTHS: Record<Season, number[]> = {
  winter: [12, 1, 2],
  spring: [3, 4, 5],
  summer: [6, 7, 8],
  autumn: [9, 10, 11],
};

export const DATA_STATUS_LABELS: Record<DataStatus, string> = {
  preliminary: "بيانات أولية إرشادية",
  reviewed: "مراجعة من مختص",
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  soil_prep: "تجهيز التربة",
  planting: "زراعة",
  irrigation: "ري",
  fertilizing: "تسميد",
  care: "عناية",
  pest_check: "فحص الآفات",
  harvest: "حصاد",
  custom: "مهمة خاصة",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "قيد الانتظار",
  done: "مكتملة",
  skipped: "متجاوزة",
};

export const PLANTING_STATUS_LABELS: Record<PlantingStatus, string> = {
  active: "نشط",
  harvested: "تم حصاده",
  archived: "مؤرشف",
};

export const GUIDE_SECTION_LABELS: Record<GuideSection, string> = {
  overview: "نظرة عامة",
  planting: "الزراعة",
  care: "العناية",
  irrigation: "الري",
  fertilization: "التسميد",
  harvest: "الحصاد",
  problems: "المشكلات الشائعة",
};
