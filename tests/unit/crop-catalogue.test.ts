import { describe, expect, it } from "vitest";
import { DOCUMENTED_CROPS } from "@/data/crop-documented";
import { CROP_SOURCES } from "@/data/crop-sources";
import { AMBIGUOUS_NAMES, ambiguityFor } from "@/domain/ambiguous-names";
import { generatePlan } from "@/domain/plan-generator";
import { SEED_CROPS } from "@/data/crops";
import { filterCrops } from "@/domain/crop-filter";
import { buildCropIndex, editDistance, isPlannable, normalizeArabic, searchCropIndex } from "@/domain/crop-search";
import { describeSimpleStatus, simplePlantingStatus } from "@/domain/planting-windows";
import { recommendCrops } from "@/domain/recommendations";
import { CROP_CATEGORIES, PLANTING_METHODS } from "@/domain/types";

const index = buildCropIndex(SEED_CROPS);
const first = (q: string) => searchCropIndex(index, q, 5)[0]?.slug;
const crop = (slug: string) => SEED_CROPS.find((c) => c.slug === slug)!;

describe("catalogue integrity", () => {
  it("has 100+ unique crops with valid slugs and categories", () => {
    expect(SEED_CROPS.length).toBeGreaterThanOrEqual(100);
    expect(new Set(SEED_CROPS.map((c) => c.slug)).size).toBe(SEED_CROPS.length);
    for (const c of SEED_CROPS) {
      expect(c.slug).toMatch(/^[a-z0-9-]{2,60}$/);
      expect(CROP_CATEGORIES).toContain(c.category);
      expect((c.otherNames ?? []).length).toBeLessThanOrEqual(12);
      for (const m of c.propagation ?? []) expect(PLANTING_METHODS).toContain(m);
    }
  });

  it("never invents data for incomplete crops", () => {
    const incomplete = SEED_CROPS.filter((c) => c.dataStatus === "incomplete");
    expect(incomplete.length).toBeGreaterThan(0);
    for (const c of incomplete) {
      expect(c.windows).toEqual([]);
      expect(c.templates).toEqual([]);
      expect(c.growthDaysMin).toBeNull();
      expect(c.sun).toBeNull();
      expect(c.water).toBeNull();
      expect(c.difficulty).toBeNull();
      expect(isPlannable(c)).toBe(false);
    }
  });

  it("every sourced window names a used reference and its passage", () => {
    const used = new Set(CROP_SOURCES.filter((src) => src.status === "used").map((src) => src.id));
    for (const c of SEED_CROPS) {
      for (const w of c.windows) {
        if (w.sourceId) {
          expect(used.has(w.sourceId), `${c.slug}: ${w.sourceId}`).toBe(true);
          expect(w.sourceDetail?.length ?? 0).toBeGreaterThan(20);
        }
      }
    }
    for (const slug of Object.keys(DOCUMENTED_CROPS)) {
      const c = crop(slug);
      expect(c.dataStatus).toBe("preliminary");
      expect(c.windows.every((w) => w.sourceId)).toBe(true);
    }
  });

  it("declares every name shared by two crops as ambiguous", () => {
    const owners = new Map<string, Set<string>>();
    for (const c of SEED_CROPS) for (const n of [c.name, ...(c.otherNames ?? [])]) {
      const k = normalizeArabic(n);
      owners.set(k, (owners.get(k) ?? new Set()).add(c.slug));
    }
    const shared = [...owners].filter(([, s]) => s.size > 1);
    for (const [name, slugs] of shared) {
      const a = AMBIGUOUS_NAMES.find((x) => normalizeArabic(x.name) === name);
      expect(a, `undeclared shared name ${name}`).toBeDefined();
      expect(a!.options.map((o) => o.slug).sort()).toEqual([...slugs].sort());
    }
    expect(ambiguityFor("خوخ")?.options.map((o) => o.slug)).toEqual(["peach", "plum"]);
  });

  it("keeps the detailed crops plannable with their windows", () => {
    for (const slug of ["tomato", "cucumber", "potato", "onion", "garlic", "lettuce", "pepper", "mint", "zaatar", "strawberry", "olive", "grape"]) {
      expect(isPlannable(crop(slug))).toBe(true);
    }
  });

  it("never merges nursery sowing and transplanting into one window", () => {
    for (const c of SEED_CROPS) for (const w of c.windows) expect(PLANTING_METHODS).toContain(w.method);
  });

  it("lists every reference with a link and honest status", () => {
    for (const s of CROP_SOURCES) {
      expect(s.url).toMatch(/^https:\/\//);
      expect(["used", "to_review"]).toContain(s.status);
    }
  });
});

describe("crop search", () => {
  it("normalises hamza, diacritics, taa marbuta and the article", () => {
    expect(normalizeArabic("الإجّاص")).toBe("اجاص");
    expect(normalizeArabic("البَنْدُورَة")).toBe("بندوره");
    expect(normalizeArabic("بالبامية")).toBe("باميه");
    expect(normalizeArabic("للبندورة")).toBe("بندوره");
  });

  it.each([
    ["بندورة", "tomato"],
    ["طماطم", "tomato"],
    ["جبس", "watermelon"],
    ["بطيخ", "watermelon"],
    ["كوسى", "zucchini"],
    ["بتنجان", "eggplant"],
    ["فريز", "strawberry"],
    ["فرفحينة", "purslane"],
    ["علت", "chicory"],
    ["ميرامية", "sage"],
    ["حامض", "lemon"],
    ["أكي دنيا", "loquat"],
    ["فصة", "alfalfa"],
    ["حنطة", "wheat"],
    ["دخان", "tobacco"],
    ["Ficus", "fig"],
  ])("finds %s → %s", (q, slug) => {
    expect(first(q)).toBe(slug);
  });

  it("tolerates small typos", () => {
    expect(first("بندوره")).toBe("tomato");
    expect(first("بندرة")).toBe("tomato"); // missing letter
    expect(first("باميا")).toBe("okra");
    expect(first("ملوخيا")).toBe("molokhia");
    expect(first("بقدونس")).toBe("parsley");
    expect(first("البقدنوس")).toBe("parsley"); // swapped letters
    expect(first("سبانح")).toBe("spinach"); // one wrong letter
  });

  it("does not fuzz very short words (فول ≠ فجل)", () => {
    const slugs = searchCropIndex(index, "فول").map((c) => c.slug);
    expect(slugs[0]).toBe("broad-bean");
    expect(slugs).not.toContain("radish");
  });

  it("ranks the exact name first and keeps shared names for both crops", () => {
    expect(searchCropIndex(index, "خوخ").map((c) => c.slug).sort()).toEqual(["peach", "plum"]);
    expect(first("فلفل")).toBe("pepper");
  });

  it("computes edit distance with transpositions", () => {
    expect(editDistance("بقدونس", "بقدنوس")).toBe(1);
    expect(editDistance("abc", "xyz", 1)).toBeGreaterThan(1);
  });

  it("drives the crop guide filter too", () => {
    expect(filterCrops(SEED_CROPS, { query: "جبس" }).map((c) => c.slug)).toEqual(["watermelon"]);
    expect(filterCrops(SEED_CROPS, { category: "legume" }).length).toBeGreaterThanOrEqual(8);
  });
});

describe("simple planting status in Hebron, Gaza and Jericho", () => {
  // Hebron = highland, Gaza = coastal, Jericho = Jordan Valley.
  it("tomato in October", () => {
    expect(simplePlantingStatus(crop("tomato"), "jordan_valley", "2026-10-10").kind).toBe("now");
    expect(simplePlantingStatus(crop("tomato"), "highland", "2026-10-10").kind).toBe("later");
    expect(simplePlantingStatus(crop("tomato"), "coastal", "2026-10-10").kind).toBe("later");
  });

  it("tomato in the highlands opens in April (soon from mid-March)", () => {
    const s = simplePlantingStatus(crop("tomato"), "highland", "2026-03-15");
    expect(s.kind).toBe("soon");
    expect(s.month).toBe(4);
    expect(describeSimpleStatus(s).title).toBe("يبدأ موسمه في نيسان");
  });

  it("okra follows the Palestinian guide: March in most governorates, January in Jericho", () => {
    const okra = crop("okra");
    expect(simplePlantingStatus(okra, "highland", "2026-03-10").kind).toBe("now"); // الخليل
    expect(simplePlantingStatus(okra, "inland_plain", "2026-03-10").kind).toBe("now");
    expect(simplePlantingStatus(okra, "jordan_valley", "2026-01-15").kind).toBe("now"); // أريحا
    expect(simplePlantingStatus(okra, "jordan_valley", "2026-03-10").kind).toBe("later");
    // Season lasting until October is NOT a sowing window.
    expect(simplePlantingStatus(okra, "highland", "2026-07-01").kind).toBe("later");
    expect(simplePlantingStatus(okra, "highland", "2026-02-10").kind).toBe("soon");
    // Gaza (coast) and arid areas are not named by the passage.
    expect(simplePlantingStatus(okra, "coastal", "2026-03-10").kind).toBe("no_data");
    expect(simplePlantingStatus(okra, "arid", "2026-03-10").kind).toBe("no_data");
    expect(okra.windows.every((w) => w.method === "direct_sowing")).toBe(true);
  });

  it("a documented crop without task rules gets general tasks and no harvest date", () => {
    const okra = crop("okra");
    expect(isPlannable(okra)).toBe(true);
    const plan = generatePlan({ crop: okra, plantedOn: "2026-03-10", zone: "highland", spaceType: "home_garden" });
    expect(plan.windowFit).toBe("in_window");
    expect(plan.expectedHarvestStart).toBeNull();
    expect(plan.tasks.some((t) => t.type === "harvest")).toBe(false);
    expect(plan.tasks.find((t) => t.type === "planting")?.title).toBe("بذر البامية في الأرض");
    expect(plan.warnings.join(" ")).toContain("مهام عامة");
    expect(plan.tasks.filter((t) => t.type === "irrigation").every((t) => t.description.includes("رطوبة التربة"))).toBe(true);
  });

  it("incomplete crops always say there is no reliable information", () => {
    for (const zone of ["highland", "coastal", "jordan_valley"] as const) {
      const s = simplePlantingStatus(crop("eggplant"), zone, "2026-05-01");
      expect(s.kind).toBe("no_data");
      expect(describeSimpleStatus(s).title).toBe("لا توجد معلومات موثوقة كافية");
    }
  });

  it("recommendations put incomplete crops in no_data, never in now", () => {
    for (const zone of ["highland", "coastal", "jordan_valley"] as const) {
      const r = recommendCrops({ crops: SEED_CROPS, today: "2026-04-20", zone, spaceType: "home_garden" });
      const now = [...r.groups.now, ...r.groups.protect].map((x) => x.crop.dataStatus);
      expect(now).not.toContain("incomplete");
      expect(r.groups.no_data.some((x) => x.crop.slug === "eggplant")).toBe(true);
    }
  });
});
