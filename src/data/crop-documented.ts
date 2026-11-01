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

const OKRA_PASSAGE =
  "فقرة مواعيد الزراعة: «تبدأ زراعة البامية المروية في معظم المحافظات الفلسطينية خلال شهر آذار، وفي أريحا والأغوار خلال كانون الثاني، ويستمر موسمها حتى تشرين الأول تقريبًا».";

export const DOCUMENTED_CROPS: Record<string, DocumentedCrop> = {
  okra: {
    summary:
      "خضار ثمرية صيفية تُزرع مروية. تبدأ زراعتها في آذار في معظم المحافظات، وفي كانون الثاني في أريحا والأغوار.",
    sourceNote:
      "مواعيد بدء الزراعة من دليل المزارع لوزارة الزراعة الفلسطينية. يذكر الدليل بداية الموسم فقط، لذلك نعرض شهر البداية دون أن نفترض أن البذر يصلح في كل أشهر الموسم الممتد حتى تشرين الأول. لا يذكر هذا المقطع الساحل (غزة) ولا المناطق الجافة بالاسم، فتركناهما دون موعد.",
    windows: [
      // «معظم المحافظات الفلسطينية» = محافظات الضفة الجبلية والسهلية (غير أريحا والأغوار).
      { zone: "highland", startMonth: 3, endMonth: 3, method: "direct_sowing", note: "البامية المروية — بداية الموسم", sourceId: "moa-ps-okra", sourceDetail: OKRA_PASSAGE },
      { zone: "inland_plain", startMonth: 3, endMonth: 3, method: "direct_sowing", note: "البامية المروية — بداية الموسم", sourceId: "moa-ps-okra", sourceDetail: OKRA_PASSAGE },
      { zone: "jordan_valley", startMonth: 1, endMonth: 1, method: "direct_sowing", note: "البامية المروية — بداية الموسم في أريحا والأغوار", sourceId: "moa-ps-okra", sourceDetail: OKRA_PASSAGE },
    ],
  },
};
