/**
 * Planting data documented from a reference, applied on top of catalogue
 * entries (crop-catalogue.ts). A crop listed here becomes "preliminary": it
 * gets planting windows and can be planned with general tasks, while every
 * field the reference does not cover stays empty.
 *
 * Rules (see docs/CROP_DATA.md):
 *  - every window names its `sourceId` (a "used" entry in crop-sources.ts)
 *    and `sourceDetail` (where in the reference + what it says);
 *  - a window is a SOWING/PLANTING period. The harvest season or the period a
 *    crop is on sale is never a planting window;
 *  - only zones the reference names are filled. Jordanian dates are not
 *    copied to Palestine without an explicit climatic justification.
 */
import type { PlantingWindow } from "@/domain/types";

export interface DocumentedCrop {
  windows: PlantingWindow[];
  /** Replaces the catalogue's "no information" sentence. */
  summary: string;
  sourceNote: string;
}

const PS = "PS";

const OKRA = {
  sourceId: "moa-ps-okra",
  sourceDetail:
    "خلاصة فقرة مواعيد الزراعة (بتصرّف): تُزرع البامية المروية في شهر آذار في معظم المحافظات الفلسطينية، وفي كانون الثاني في محافظة أريحا والأغوار.",
};

/** Field crops: general dates for Palestine (wafa.ps). Not tied to a climate zone. */
const WAFA = "wafa-field-crops";
const wafaText = (detail: string) => ({ sourceId: WAFA, sourceDetail: `النص الشارح (بتصرّف): ${detail}` });
const wafaTable = (detail: string) => ({ sourceId: WAFA, sourceDetail: `الجدول (بتصرّف): ${detail}` });
/** Where the section does not split text and table for this crop. */
const wafaSection = (detail: string) => ({ sourceId: WAFA, sourceDetail: `قسم مواعيد الزراعة (بتصرّف): ${detail}` });

const FIELD_NOTE =
  "مواعيد عامة لفلسطين من مركز المعلومات الوطني الفلسطيني (وفا)، غير مخصصة لمنطقة مناخية أو قرية بعينها. تتأثر الزراعة البعلية بموعد الأمطار، فتأكد من الإرشاد الزراعي المحلي.";

export const DOCUMENTED_CROPS: Record<string, DocumentedCrop> = {
  okra: {
    summary:
      "خضار ثمرية صيفية. تُزرع البامية المروية في آذار في معظم المحافظات الفلسطينية، وفي كانون الثاني في أريحا والأغوار.",
    sourceNote:
      "مواعيد الزراعة من دليل المزارع لوزارة الزراعة الفلسطينية (ملف PDF). يخص الدليل فلسطين، فلا تُعرض هذه المواعيد كمواعيد موثّقة لمواقع في دول أخرى. لا يسمّي المقطع الساحل (غزة) ولا المناطق الجافة، فتركناهما دون موعد.",
    windows: [
      // «معظم المحافظات الفلسطينية» = محافظات الضفة الجبلية والسهلية (غير أريحا والأغوار).
      { zone: "highland", countryCode: PS, startMonth: 3, endMonth: 3, method: "direct_sowing", note: "البامية المروية", ...OKRA },
      { zone: "inland_plain", countryCode: PS, startMonth: 3, endMonth: 3, method: "direct_sowing", note: "البامية المروية", ...OKRA },
      { zone: "jordan_valley", countryCode: PS, startMonth: 1, endMonth: 1, method: "direct_sowing", note: "البامية المروية في أريحا والأغوار", ...OKRA },
    ],
  },
  wheat: {
    summary: "من أهم المحاصيل الحقلية الشتوية في فلسطين. يُزرع عمومًا في الخريف وبداية الشتاء حسب الأمطار.",
    sourceNote: FIELD_NOTE,
    windows: [
      { zone: null, countryCode: PS, startMonth: 10, endMonth: 11, method: "direct_sowing", note: "حسب النص الشارح", ...wafaText("يُزرع القمح في تشرين الأول وتشرين الثاني.") },
      { zone: null, countryCode: PS, startMonth: 11, endMonth: 12, method: "direct_sowing", note: "حسب الجدول: البدء في تشرين الثاني والاستمرار في كانون الأول", ...wafaTable("بدء زراعة القمح في تشرين الثاني واستمرارها في كانون الأول.") },
    ],
  },
  barley: {
    summary: "محصول حقلي شتوي. يُزرع عمومًا في تشرين الأول أو تشرين الثاني حسب الأمطار.",
    sourceNote: FIELD_NOTE,
    windows: [
      { zone: null, countryCode: PS, startMonth: 10, endMonth: 11, method: "direct_sowing", note: "حسب النص الشارح: حسب الأمطار", ...wafaText("يُزرع الشعير غالبًا في تشرين الأول أو تشرين الثاني حسب الأمطار.") },
      { zone: null, countryCode: PS, startMonth: 12, endMonth: 12, method: "direct_sowing", note: "حسب الجدول: استمرار الزراعة", ...wafaTable("استمرار زراعة الشعير في كانون الأول.") },
    ],
  },
  lentil: {
    summary: "محصول بقولي شتوي. تبدأ زراعته عمومًا في كانون الأول.",
    sourceNote: FIELD_NOTE,
    windows: [{ zone: null, countryCode: PS, startMonth: 12, endMonth: 12, method: "direct_sowing", note: "بدء الزراعة", ...wafaSection("بدء زراعة العدس خلال كانون الأول.") }],
  },
  vetch: {
    summary: "محصول علفي بقولي شتوي. تبدأ زراعته عمومًا في كانون الأول.",
    sourceNote: FIELD_NOTE,
    windows: [{ zone: null, countryCode: PS, startMonth: 12, endMonth: 12, method: "direct_sowing", note: "بدء الزراعة", ...wafaSection("بدء زراعة البيقيا خلال كانون الأول.") }],
  },
  "bitter-vetch": {
    summary: "محصول علفي بقولي شتوي. تبدأ زراعته عمومًا في كانون الأول.",
    sourceNote: FIELD_NOTE,
    windows: [{ zone: null, countryCode: PS, startMonth: 12, endMonth: 12, method: "direct_sowing", note: "بدء الزراعة", ...wafaSection("بدء زراعة الكرسنة خلال كانون الأول.") }],
  },
  chickpea: {
    summary: "محصول بقولي. يُزرع عمومًا في كانون الأول وتستمر زراعته في كانون الثاني.",
    sourceNote: FIELD_NOTE,
    windows: [
      { zone: null, countryCode: PS, startMonth: 12, endMonth: 1, method: "direct_sowing", note: "البدء في كانون الأول والاستمرار في كانون الثاني", ...wafaSection("زراعة الحمص في كانون الأول واستمرارها في كانون الثاني.") },
    ],
  },
  sorghum: {
    summary: "محصول حقلي صيفي. يُزرع عمومًا في نيسان.",
    sourceNote: FIELD_NOTE,
    windows: [{ zone: null, countryCode: PS, startMonth: 4, endMonth: 4, method: "direct_sowing", note: "موعد الزراعة", ...wafaSection("زراعة الذرة البيضاء في نيسان.") }],
  },
};
