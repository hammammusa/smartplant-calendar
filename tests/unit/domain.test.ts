import { describe, expect, it } from "vitest";
import { SEED_CROPS } from "@/data/crops";
import { nearestRegion, REGIONS } from "@/data/regions";
import { filterCrops, normalizeArabic } from "@/domain/crop-filter";
import { bucketTasks, filterTasks, isOverdue, postponedDate } from "@/domain/tasks";
import { deriveAlerts, describeWeatherCode, DEFAULT_THRESHOLDS } from "@/domain/weather";
import { planRequestSchema, registerSchema, taskInputSchema } from "@/domain/schemas";
import type { Task } from "@/domain/types";

describe("crop search", () => {
  it("normalises Arabic spelling variants", () => {
    expect(normalizeArabic("البندورة")).toBe(normalizeArabic("بندوره"));
    expect(normalizeArabic("الطَّماطِم")).toBe("طماطم");
  });

  it("finds crops by name or alternative name", () => {
    expect(filterCrops(SEED_CROPS, { query: "طماطم" }).map((c) => c.slug)).toEqual(["tomato"]);
    expect(filterCrops(SEED_CROPS, { query: "زوفا" }).map((c) => c.slug)).toEqual(["zaatar"]);
  });

  it("filters by category, space and season", () => {
    expect(filterCrops(SEED_CROPS, { category: "tree" }).map((c) => c.slug)).toEqual(expect.arrayContaining(["grape", "olive", "fig", "almond"]));
    expect(filterCrops(SEED_CROPS, { space: "balcony" }).some((c) => c.slug === "olive")).toBe(false);
    const autumnValley = filterCrops(SEED_CROPS, { season: "autumn", zone: "jordan_valley" }).map((c) => c.slug);
    expect(autumnValley).toContain("tomato");
    expect(autumnValley).not.toContain("olive");
  });
});

const task = (over: Partial<Task>): Task => ({
  id: "t",
  plantingId: null,
  gardenId: null,
  type: "irrigation",
  title: "ري",
  description: null,
  dueDate: "2026-10-27",
  status: "pending",
  completedAt: null,
  postponedCount: 0,
  source: "generated",
  createdAt: "2026-10-01T00:00:00Z",
  ...over,
});

describe("tasks", () => {
  const today = "2026-10-27";
  it("detects overdue pending tasks only", () => {
    expect(isOverdue(task({ dueDate: "2026-10-26" }), today)).toBe(true);
    expect(isOverdue(task({ dueDate: "2026-10-26", status: "done" }), today)).toBe(false);
    expect(isOverdue(task({ dueDate: today }), today)).toBe(false);
  });

  it("buckets tasks into overdue / today / upcoming", () => {
    const b = bucketTasks(
      [
        task({ id: "a", dueDate: "2026-10-20" }),
        task({ id: "b", dueDate: today }),
        task({ id: "c", dueDate: "2026-10-30" }),
        task({ id: "d", dueDate: "2026-12-30" }),
        task({ id: "e", dueDate: today, status: "done" }),
      ],
      today,
    );
    expect(b.overdue.map((t) => t.id)).toEqual(["a"]);
    expect(b.today.map((t) => t.id)).toEqual(["b"]);
    expect(b.upcoming.map((t) => t.id)).toEqual(["c"]);
  });

  it("postpones overdue tasks relative to today", () => {
    expect(postponedDate(task({ dueDate: "2026-10-01" }), 2, today)).toBe("2026-10-29");
    expect(postponedDate(task({ dueDate: "2026-11-01" }), 1, today)).toBe("2026-11-02");
  });

  it("filters by status including overdue", () => {
    const list = [task({ id: "a", dueDate: "2026-10-01" }), task({ id: "b", type: "harvest" })];
    expect(filterTasks(list, { status: "overdue" }, today).map((t) => t.id)).toEqual(["a"]);
    expect(filterTasks(list, { type: "harvest" }, today).map((t) => t.id)).toEqual(["b"]);
  });
});

describe("weather alerts", () => {
  it("raises frost, heat and rain alerts using thresholds", () => {
    const alerts = deriveAlerts([
      { date: "2026-01-10", weatherCode: 0, tempMax: 9, tempMin: 1, precipitationProbability: 10, precipitationSum: 0, windSpeedMax: 10 },
      { date: "2026-07-10", weatherCode: 0, tempMax: 38, tempMin: 24, precipitationProbability: 0, precipitationSum: 0, windSpeedMax: 10 },
      { date: "2026-11-10", weatherCode: 61, tempMax: 20, tempMin: 12, precipitationProbability: 80, precipitationSum: 5, windSpeedMax: 45 },
      { date: "2026-11-11", weatherCode: 63, tempMax: 18, tempMin: 11, precipitationProbability: 90, precipitationSum: 30, windSpeedMax: 10 },
    ]);
    expect(alerts.map((a) => a.kind)).toEqual(["frost", "heat", "rain", "wind", "heavy_rain"]);
    expect(alerts.find((a) => a.kind === "heat")!.message).toContain("افحص رطوبة التربة");
  });

  it("respects custom thresholds and missing values", () => {
    const day = { date: "2026-01-10", weatherCode: 0, tempMax: null, tempMin: 3, precipitationProbability: null, precipitationSum: null, windSpeedMax: null };
    expect(deriveAlerts([day])).toHaveLength(0);
    expect(deriveAlerts([day], { ...DEFAULT_THRESHOLDS, frostTempC: 4 })).toHaveLength(1);
  });

  it("describes WMO codes in Arabic", () => {
    expect(describeWeatherCode(0).label).toBe("صحو");
    expect(describeWeatherCode(63).label).toBe("أمطار");
    expect(describeWeatherCode(999).label).toBe("غير محدد");
  });
});

describe("regions", () => {
  it("keeps Hebron, Gaza and Jericho in different climate zones", () => {
    const zone = (id: string) => REGIONS.find((r) => r.id === id)!.zone;
    expect(new Set([zone("ps-hebron"), zone("ps-gaza"), zone("ps-jericho")]).size).toBe(3);
  });
  it("finds the nearest city to a coordinate", () => {
    expect(nearestRegion(31.53, 35.09).id).toBe("ps-hebron");
  });
});

describe("validation messages are Arabic", () => {
  it("rejects bad plan input with Arabic errors", () => {
    const r = planRequestSchema.safeParse({ cropSlug: "", plantedOn: "2026-02-30", zone: "x", spaceType: "y", regionId: null, gardenName: "a", latitude: null, longitude: null });
    expect(r.success).toBe(false);
    for (const issue of r.error!.issues) expect(issue.message).toMatch(/[؀-ۿ]/);
  });
  it("validates task input", () => {
    expect(taskInputSchema.safeParse({ title: "سقاية", dueDate: "2026-10-27", type: "irrigation" }).success).toBe(true);
    expect(taskInputSchema.safeParse({ title: "س", dueDate: "2026-10-27", type: "irrigation" }).success).toBe(false);
  });
  it("requires matching passwords and terms", () => {
    const base = { fullName: "أحمد", email: "a@b.co", password: "12345678" };
    const terms = registerSchema.safeParse({ ...base, confirmPassword: "12345678", acceptTerms: false });
    expect(terms.error!.issues.map((i) => i.message)).toContain("يجب الموافقة على شروط الاستخدام وسياسة الخصوصية");
    const mismatch = registerSchema.safeParse({ ...base, confirmPassword: "123", acceptTerms: true });
    expect(mismatch.error!.issues.map((i) => i.message)).toContain("كلمتا المرور غير متطابقتين");
  });
});

import { authErrorMessage, safeNext } from "@/lib/auth-errors";

describe("auth helpers", () => {
  it("only allows same-site redirects", () => {
    expect(safeNext("/calendar")).toBe("/calendar");
    expect(safeNext("//evil.com")).toBe("/dashboard");
    expect(safeNext("https://evil.com")).toBe("/dashboard");
    expect(safeNext("/\\evil.com")).toBe("/dashboard");
    expect(safeNext(null)).toBe("/dashboard");
  });
  it("translates Supabase auth errors to Arabic", () => {
    expect(authErrorMessage({ code: "invalid_credentials" })).toBe("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
    expect(authErrorMessage({ status: 429 })).toContain("محاولات كثيرة");
    expect(authErrorMessage({ message: "something odd" })).toMatch(/[؀-ۿ]/);
  });
});
