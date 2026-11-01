import { isPlannable } from "@/domain/crop-search";
import { describe, expect, it } from "vitest";
import { SEED_CROPS, findSeedCrop } from "@/data/crops";
import { generatePlan, MAX_TASKS_PER_PLAN, adjustIntervalForSpace } from "@/domain/plan-generator";
import { evaluateWindowFit, monthInWindow } from "@/domain/planting-windows";
import { diffDays } from "@/lib/dates";
import type { Crop } from "@/domain/types";

const tomato = findSeedCrop("tomato")!;

describe("planting windows", () => {
  it("handles windows that wrap the year end", () => {
    expect(monthInWindow(11, 10, 2)).toBe(true);
    expect(monthInWindow(1, 10, 2)).toBe(true);
    expect(monthInWindow(5, 10, 2)).toBe(false);
  });

  it("distinguishes zones: Jericho vs Hebron for tomatoes in October", () => {
    expect(evaluateWindowFit(tomato, "jordan_valley", 10)).toBe("in_window");
    expect(evaluateWindowFit(tomato, "highland", 10)).toBe("outside_window");
    expect(evaluateWindowFit(tomato, "highland", 3)).toBe("near_window");
  });
});

describe("generatePlan", () => {
  it("anchors every task to the planting date", () => {
    const plan = generatePlan({ crop: tomato, plantedOn: "2026-04-15", zone: "highland", spaceType: "home_garden" });
    const planting = plan.tasks.find((t) => t.type === "planting")!;
    const soil = plan.tasks.find((t) => t.type === "soil_prep")!;
    expect(planting.dueDate).toBe("2026-04-15");
    expect(diffDays("2026-04-15", soil.dueDate)).toBe(-10);
    expect(plan.windowFit).toBe("in_window");
  });

  it("computes the expected harvest window from growth days", () => {
    const plan = generatePlan({ crop: tomato, plantedOn: "2026-04-15", zone: "highland", spaceType: "home_garden" });
    expect(plan.expectedHarvestStart).toBe("2026-06-14");
    expect(plan.expectedHarvestEnd).toBe("2026-07-14");
    const harvest = plan.tasks.find((t) => t.type === "harvest")!;
    expect(harvest.description).toContain("نافذة الحصاد التقديرية");
  });

  it("returns tasks sorted by date", () => {
    const plan = generatePlan({ crop: tomato, plantedOn: "2026-04-15", zone: "highland", spaceType: "home_garden" });
    const dates = plan.tasks.map((t) => t.dueDate);
    expect([...dates].sort()).toEqual(dates);
  });

  it("checks irrigation more often in containers", () => {
    const ground = generatePlan({ crop: tomato, plantedOn: "2026-04-15", zone: "highland", spaceType: "home_garden" });
    const pots = generatePlan({ crop: tomato, plantedOn: "2026-04-15", zone: "highland", spaceType: "containers" });
    const count = (p: typeof ground) => p.tasks.filter((t) => t.type === "irrigation").length;
    expect(count(pots)).toBeGreaterThan(count(ground));
    expect(adjustIntervalForSpace(3, "irrigation", "balcony")).toBe(2);
    expect(adjustIntervalForSpace(3, "fertilizing", "balcony")).toBe(3);
    expect(adjustIntervalForSpace(1, "irrigation", "containers")).toBe(1);
  });

  it("warns when planting outside the zone window", () => {
    const plan = generatePlan({ crop: tomato, plantedOn: "2026-10-27", zone: "highland", spaceType: "home_garden" });
    expect(plan.windowFit).toBe("outside_window");
    expect(plan.warnings.some((w) => w.includes("خارج المواعيد"))).toBe(true);
  });

  it("never presents preliminary data as definitive", () => {
    const plan = generatePlan({ crop: tomato, plantedOn: "2026-04-15", zone: "highland", spaceType: "home_garden" });
    expect(plan.isTentative).toBe(true);
    expect(plan.warnings.some((w) => w.includes("ليس توصية قطعية"))).toBe(true);
  });

  it("does not invent a harvest date for perennials without reliable data", () => {
    const olive = findSeedCrop("olive")!;
    const plan = generatePlan({ crop: olive, plantedOn: "2026-01-10", zone: "highland", spaceType: "small_plot" });
    expect(plan.expectedHarvestStart).toBeNull();
    expect(plan.tasks.some((t) => t.type === "harvest")).toBe(false);
  });

  it("limits tree irrigation to dry-season months", () => {
    const olive = findSeedCrop("olive")!;
    const plan = generatePlan({ crop: olive, plantedOn: "2026-01-10", zone: "highland", spaceType: "small_plot" });
    const months = plan.tasks.filter((t) => t.type === "irrigation").map((t) => Number(t.dueDate.slice(5, 7)));
    expect(months.length).toBeGreaterThan(0);
    expect(months.every((m) => m >= 5 && m <= 10)).toBe(true);
  });

  it("warns when the space is unsuitable", () => {
    const olive = findSeedCrop("olive")!;
    const plan = generatePlan({ crop: olive, plantedOn: "2026-01-10", zone: "highland", spaceType: "balcony" });
    expect(plan.warnings.some((w) => w.includes("شرفة"))).toBe(true);
  });

  it("caps runaway templates", () => {
    const broken: Crop = {
      ...tomato,
      templates: [{ key: "x", type: "irrigation", title: "x", description: "", offsetDays: 0, repeatEveryDays: 1, untilOffsetDays: 10_000 }],
    };
    const plan = generatePlan({ crop: broken, plantedOn: "2026-04-15", zone: "highland", spaceType: "home_garden" });
    expect(plan.tasks.length).toBe(MAX_TASKS_PER_PLAN);
  });

  it("produces a valid plan for every plannable seed crop in every zone", () => {
    for (const crop of SEED_CROPS.filter(isPlannable)) {
      for (const zone of ["coastal", "highland", "inland_plain", "jordan_valley", "arid"] as const) {
        const plan = generatePlan({ crop, plantedOn: "2026-11-01", zone, spaceType: crop.spaceTypes[0] });
        expect(plan.tasks.length).toBeGreaterThan(2);
        expect(new Set(plan.tasks.map((t) => t.templateKey)).size).toBe(plan.tasks.length);
      }
    }
  });
});
