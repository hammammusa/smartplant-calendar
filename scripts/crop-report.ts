/**
 * Prints the real size and coverage of the crop catalogue.
 * Run: npm run crops:report
 */
import { CROP_SOURCES } from "../src/data/crop-sources";
import { SEED_CROPS } from "../src/data/crops";
import { CATEGORY_LABELS, CLIMATE_ZONE_LABELS, DATA_STATUS_LABELS } from "../src/domain/labels";
import { CLIMATE_ZONES, CROP_CATEGORIES, DATA_STATUSES } from "../src/domain/types";

const total = SEED_CROPS.length;
const pct = (n: number) => `${((n / total) * 100).toFixed(1)}%`;
const aliases = SEED_CROPS.reduce((n, c) => n + (c.otherNames?.length ?? 0), 0);

console.log(`المحاصيل: ${total}`);
for (const s of DATA_STATUSES) console.log(`  ${DATA_STATUS_LABELS[s]}: ${SEED_CROPS.filter((c) => c.dataStatus === s).length}`);
console.log(`الأسماء البديلة: ${aliases}`);
console.log("حسب التصنيف:");
for (const cat of CROP_CATEGORIES) console.log(`  ${CATEGORY_LABELS[cat]}: ${SEED_CROPS.filter((c) => c.category === cat).length}`);
console.log("تغطية مواعيد الزراعة حسب المنطقة (محاصيل لها موعد واحد على الأقل):");
for (const z of CLIMATE_ZONES) {
  const n = SEED_CROPS.filter((c) => c.windows.some((w) => w.zone === z)).length;
  console.log(`  ${CLIMATE_ZONE_LABELS[z]}: ${n} من ${total} (${pct(n)})`);
}
const usedIds = new Set(CROP_SOURCES.filter((s) => s.status === "used").map((s) => s.id));
console.log("مواعيد موثّقة بمصدر مستخدم (لكل منطقة):");
for (const z of CLIMATE_ZONES) {
  const n = SEED_CROPS.filter((c) => c.windows.some((w) => w.zone === z && w.sourceId && usedIds.has(w.sourceId))).length;
  console.log(`  ${CLIMATE_ZONE_LABELS[z]}: ${n} من ${total} (${pct(n)})`);
}
const sourcedCrops = SEED_CROPS.filter((c) => c.windows.some((w) => w.sourceId && usedIds.has(w.sourceId)));
console.log(`محاصيل لها مواعيد موثّقة بمصدر: ${sourcedCrops.length} (${sourcedCrops.map((c) => c.name).join("، ")})`);
const used = usedIds.size;
console.log(`المراجع: ${CROP_SOURCES.length} (مستخدمة: ${used}، بانتظار المراجعة: ${CROP_SOURCES.length - used})`);
