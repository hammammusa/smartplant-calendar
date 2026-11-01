/**
 * Reference register for the crop catalogue.
 *
 * `status` is honest about how each reference was used:
 *  - "used": planting data in the catalogue was taken from it and checked.
 *  - "to_review": found while researching, but its full text could not be
 *    read from the build environment (the publisher's site was unreachable),
 *    so NOTHING in the catalogue is derived from it yet. It is listed so an
 *    agronomist (or a later update) can review it and fill the windows.
 *
 * Adding planting windows for an "incomplete" crop requires a reference here
 * with status "used" and the crop's slug in `crops`.
 */
export interface CropSource {
  id: string;
  title: string;
  publisher: string;
  url: string;
  /** Arabic note on what the reference covers. */
  covers: string;
  status: "used" | "to_review";
  /** Crop slugs the reference is relevant to (empty = general). */
  crops: string[];
}

export const CROP_SOURCES: CropSource[] = [
  {
    id: "narc-tomato",
    title: "الدليل الفني لإنتاج البندورة في الأردن",
    publisher: "المركز الوطني للبحوث الزراعية (الأردن)",
    url: "https://www.narc.gov.jo/ebv4.0/root_storage/ar/eb_list_page/tomato.pdf",
    covers: "مواعيد عروات البندورة في الأغوار والمرتفعات، المكشوفة والمحمية.",
    status: "to_review",
    crops: ["tomato"],
  },
  {
    id: "narc-olive",
    title: "الدليل الفني لإنتاج الزيتون وزيت الزيتون",
    publisher: "المركز الوطني للبحوث الزراعية (الأردن)",
    url: "https://www.narc.gov.jo/ebv4.0/root_storage/ar/eb_list_page/olive.pdf",
    covers: "زراعة غراس الزيتون وخدمتها.",
    status: "to_review",
    crops: ["olive"],
  },
  {
    id: "pcbs-agricensus-2021",
    title: "التعداد الزراعي 2021 — تعريف العروات الزراعية للخضار",
    publisher: "الجهاز المركزي للإحصاء الفلسطيني ووزارة الزراعة الفلسطينية",
    url: "https://www.pcbs.gov.ps/Downloads/book2679.pdf",
    covers: "تعريف فترات العروات (ربيعية، صيفية، خريفية، شتوية) في فلسطين، دون مواعيد لكل محصول.",
    status: "to_review",
    crops: [],
  },
  {
    id: "jordan-planting-dates-note",
    title: "A Short Scientific Note on the Horticultural Crops Optimum Planting Dates in Jordan",
    publisher: "ResearchGate (ورقة علمية قصيرة)",
    url: "https://www.researchgate.net/publication/329611203_A_Short_Scientific_Note_on_the_Horticultural_Crops_Optimum_Planting_Dates_in_Jordan",
    covers: "مواعيد زراعة محاصيل بستانية في الأغوار والمرتفعات الأردنية، وهي قريبة مناخيًا من الأغوار والمرتفعات الفلسطينية.",
    status: "to_review",
    crops: [],
  },
  {
    id: "vegetable-schedule-rg",
    title: "جدول مواعيد زراعة الخضار",
    publisher: "ResearchGate",
    url: "https://www.researchgate.net/publication/340978371_jdwl_mwayd_zrat_alkhdar_A_schedule_for_planting_vegetables",
    covers: "جدول عام لمواعيد زراعة الخضار (يحتاج تحديد البلد والمنطقة قبل الاعتماد عليه).",
    status: "to_review",
    crops: [],
  },
  {
    id: "fao-crop-calendar",
    title: "FAO Crop Calendar",
    publisher: "منظمة الأغذية والزراعة (فاو)",
    url: "https://cropcalendar.apps.fao.org/",
    covers: "تقويم زراعي حسب المناطق البيئية الزراعية لعدد من الدول؛ يجب التحقق من توفر بيانات فلسطين أو الأردن ولبنان وسوريا.",
    status: "to_review",
    crops: [],
  },
  {
    id: "moa-palestine",
    title: "النشرات الإرشادية لوزارة الزراعة الفلسطينية",
    publisher: "وزارة الزراعة الفلسطينية",
    url: "https://www.moa.pna.ps/",
    covers: "المصدر المحلي المفضّل لمواعيد الزراعة في محافظات الضفة وغزة.",
    status: "to_review",
    crops: [],
  },
];

export function sourcesForCrop(slug: string): CropSource[] {
  return CROP_SOURCES.filter((s) => s.crops.includes(slug));
}
