/**
 * Plan generator: expands a crop's task templates into dated tasks relative to
 * the planting date. Pure and deterministic so it can run both in the browser
 * (guest mode) and on the server (signed-in users, where the crop rules are
 * re-loaded from the database instead of trusted from the client).
 */
import { addDays, monthOf } from "@/lib/dates";
import { formatShortDate } from "@/lib/format";
import { CONTAINER_SPACES, SPACE_TYPE_LABELS } from "./labels";
import { evaluateWindowFit, type WindowFit } from "./planting-windows";
import type { ClimateZone, Crop, ISODate, SpaceType, TaskType } from "./types";

export interface PlanInput {
  crop: Crop;
  plantedOn: ISODate;
  zone: ClimateZone;
  spaceType: SpaceType;
}

export interface GeneratedTask {
  templateKey: string;
  type: TaskType;
  title: string;
  description: string;
  dueDate: ISODate;
}

export interface GeneratedPlan {
  tasks: GeneratedTask[];
  expectedHarvestStart: ISODate | null;
  expectedHarvestEnd: ISODate | null;
  windowFit: WindowFit;
  /** Arabic notices the UI must show next to the plan. */
  warnings: string[];
  /** True when the plan relies on incomplete data (e.g. unknown growth period). */
  isTentative: boolean;
}

/** Safety cap so a misconfigured template can never explode the plan. */
export const MAX_TASKS_PER_PLAN = 400;

/** Containers dry out faster: shorten irrigation check intervals. */
export function adjustIntervalForSpace(interval: number, type: TaskType, spaceType: SpaceType): number {
  if (type !== "irrigation" || !CONTAINER_SPACES.includes(spaceType)) return interval;
  return Math.max(1, Math.round(interval * 0.6));
}

export function generatePlan(input: PlanInput): GeneratedPlan {
  const { crop, plantedOn, zone, spaceType } = input;
  const tasks: GeneratedTask[] = [];
  const warnings: string[] = [];
  const containerSpace = CONTAINER_SPACES.includes(spaceType);

  for (const t of crop.templates) {
    const base = {
      templateKey: t.key,
      type: t.type,
      title: t.title,
      description:
        containerSpace && t.type === "irrigation"
          ? `${t.description} في الأصص والأحواض تجف التربة أسرع، لذلك قُرّبت مواعيد المتابعة.`
          : t.description,
    };

    if (t.repeatEveryDays && t.repeatEveryDays > 0) {
      const interval = adjustIntervalForSpace(t.repeatEveryDays, t.type, spaceType);
      const until = t.untilOffsetDays ?? t.offsetDays;
      for (let offset = t.offsetDays; offset <= until; offset += interval) {
        const dueDate = addDays(plantedOn, offset);
        if (t.activeMonths?.length && !t.activeMonths.includes(monthOf(dueDate))) continue;
        tasks.push({ ...base, templateKey: `${t.key}#${offset}`, dueDate });
        if (tasks.length >= MAX_TASKS_PER_PLAN) break;
      }
    } else {
      tasks.push({ ...base, dueDate: addDays(plantedOn, t.offsetDays) });
    }
    if (tasks.length >= MAX_TASKS_PER_PLAN) break;
  }

  tasks.sort((a, b) => (a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0));

  let expectedHarvestStart: ISODate | null = null;
  let expectedHarvestEnd: ISODate | null = null;
  let isTentative = crop.dataStatus !== "reviewed";

  if (crop.growthDaysMin != null && crop.growthDaysMax != null) {
    expectedHarvestStart = addDays(plantedOn, crop.growthDaysMin);
    expectedHarvestEnd = addDays(plantedOn, crop.growthDaysMax);
    const harvest = tasks.find((t) => t.type === "harvest");
    if (harvest) {
      harvest.description = `${harvest.description} نافذة الحصاد التقديرية: من ${formatShortDate(expectedHarvestStart)} إلى ${formatShortDate(expectedHarvestEnd)}.`;
    }
  } else {
    isTentative = true;
    warnings.push(
      crop.lifeCycle === "perennial"
        ? "هذا محصول معمّر ولا تتوفر لدينا مدة موثوقة حتى أول إنتاج، لذلك تركز الخطة على العناية في السنة الأولى دون موعد حصاد محدد."
        : "لا تتوفر مدة نمو موثوقة لهذا المحصول، لذلك لم نحدد موعد حصاد متوقع.",
    );
  }

  const windowFit = evaluateWindowFit(crop, zone, monthOf(plantedOn));
  if (windowFit === "outside_window") {
    warnings.push(
      "تاريخ الزراعة المختار يقع خارج المواعيد الأولية المقترحة لمنطقتك المناخية. قد يتأثر النبات بالحرارة أو البرودة؛ راجع المواعيد المقترحة أو استشر مرشدًا زراعيًا محليًا.",
    );
  } else if (windowFit === "near_window") {
    warnings.push("تاريخ الزراعة قريب من حافة الموعد المقترح لمنطقتك؛ راقب الطقس جيدًا في الأسابيع الأولى.");
  } else if (windowFit === "no_data") {
    warnings.push("لا تتوفر لدينا مواعيد زراعة لهذا المحصول في منطقتك المناخية، لذلك لا يمكن تقييم ملاءمة التاريخ.");
  }

  if (!crop.spaceTypes.includes(spaceType)) {
    warnings.push(
      `لا يُعد هذا المحصول مناسبًا عادةً لـ«${SPACE_TYPE_LABELS[spaceType]}». يمكنك المتابعة، لكن النتائج قد تكون محدودة.`,
    );
  }

  if (crop.dataStatus !== "reviewed") {
    warnings.push(
      "الجدول مبني على بيانات أولية عامة وليس توصية قطعية. عدّل المواعيد حسب حالة نباتك وتربتك وطقسك.",
    );
  }

  return { tasks, expectedHarvestStart, expectedHarvestEnd, windowFit, warnings, isTentative };
}
