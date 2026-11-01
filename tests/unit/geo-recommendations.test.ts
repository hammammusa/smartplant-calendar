import { describe, expect, it } from "vitest";
import { SEED_CROPS, findSeedCrop } from "@/data/crops";
import { accuracyLevel, distanceKm, distanceToCoastKm, roundForService, suggestZone } from "@/domain/geo";
import { compareRecommendations, recommendCrop, recommendCrops, SOON_DAYS, upcomingStarts } from "@/domain/recommendations";
import type { WeatherAlert } from "@/domain/weather";

const town = (name: string, zone: "highland" | "coastal") => ({ name, zone });

describe("geo", () => {
  it("measures distances", () => {
    // Hebron → Jerusalem is roughly 27–30 km.
    const d = distanceKm({ latitude: 31.5326, longitude: 35.0998 }, { latitude: 31.7683, longitude: 35.2137 });
    expect(d).toBeGreaterThan(25);
    expect(d).toBeLessThan(32);
  });

  it("knows Gaza is on the coast and Hebron is not", () => {
    expect(distanceToCoastKm({ latitude: 31.5017, longitude: 34.4668 })).toBeLessThan(5);
    expect(distanceToCoastKm({ latitude: 31.5326, longitude: 35.0998 })).toBeGreaterThan(40);
  });

  it("suggests zones from elevation, not from the nearest city", () => {
    // A village near Hebron at 900 m → highland.
    expect(suggestZone({ latitude: 31.55, longitude: 35.06 }, 900, town("الخليل", "highland"))?.zone).toBe("highland");
    // Jericho (≈ −250 m) → Jordan Valley, even though the nearest listed big city could be Jerusalem.
    expect(suggestZone({ latitude: 31.86, longitude: 35.45 }, -250, town("القدس", "highland"))?.zone).toBe("jordan_valley");
    // Gaza city (≈ 20 m, by the sea) → coastal.
    expect(suggestZone({ latitude: 31.5, longitude: 34.46 }, 20, null)?.zone).toBe("coastal");
    // Jenin plain (≈ 150 m, ~40 km inland) → inland plain.
    expect(suggestZone({ latitude: 32.46, longitude: 35.3 }, 150, null)?.zone).toBe("inland_plain");
    // Beersheba (≈ 280 m, dry south, far from the sea) → arid.
    expect(suggestZone({ latitude: 31.25, longitude: 34.79 }, 280, null)?.zone).toBe("arid");
    // Rafah is southern but on the coast → coastal, not arid.
    expect(suggestZone({ latitude: 31.29, longitude: 34.25 }, 40, null)?.zone).toBe("coastal");
  });

  it("falls back to the nearest town only without elevation, and says so", () => {
    const s = suggestZone({ latitude: 31.6, longitude: 35.1 }, null, town("الخليل", "highland"))!;
    expect(s.basis).toBe("nearest_town");
    expect(s.reason).toContain("لم يتوفر ارتفاع موثوق");
    expect(suggestZone({ latitude: 31.6, longitude: 35.1 }, null, null)).toBeNull();
  });

  it("grades GPS accuracy and rounds coordinates for privacy", () => {
    expect(accuracyLevel(12)).toBe("high");
    expect(accuracyLevel(180)).toBe("medium");
    expect(accuracyLevel(1500)).toBe("low");
    expect(accuracyLevel(8000)).toBe("very_low");
    expect(roundForService({ latitude: 31.612345, longitude: 35.071299 })).toEqual({ latitude: 31.61, longitude: 35.07 });
  });
});

describe("recommendations", () => {
  const tomato = findSeedCrop("tomato")!;
  const garlic = findSeedCrop("garlic")!;
  const olive = findSeedCrop("olive")!;

  it("differs between highland, coastal and Jordan Valley in the same month", () => {
    const highland = recommendCrop(tomato, { crops: SEED_CROPS, today: "2026-10-10", zone: "highland", spaceType: "home_garden" });
    const valley = recommendCrop(tomato, { crops: SEED_CROPS, today: "2026-10-10", zone: "jordan_valley", spaceType: "home_garden" });
    expect(valley.status).toBe("now");
    expect(highland.status).toBe("later");
    expect(highland.nextWindowStart).toBe("2027-04-01");
  });

  it("changes with the month", () => {
    const base = { crops: SEED_CROPS, zone: "highland" as const, spaceType: "home_garden" as const };
    expect(recommendCrop(tomato, { ...base, today: "2026-04-20" }).status).toBe("now");
    expect(recommendCrop(tomato, { ...base, today: "2026-03-01" }).status).toBe("soon");
    expect(recommendCrop(tomato, { ...base, today: "2026-03-01" }).daysUntilNextWindow).toBe(31);
    expect(recommendCrop(tomato, { ...base, today: "2026-07-01" }).status).toBe("later");
  });

  it("computes days left in a window that wraps the year end", () => {
    // Lettuce on the coast: Sep–Mar. On 20 Feb there are 39 days left (to 31 Mar).
    const lettuce = findSeedCrop("lettuce")!;
    const r = recommendCrop(lettuce, { crops: SEED_CROPS, today: "2027-02-20", zone: "coastal", spaceType: "balcony" });
    expect(r.status).toBe("now");
    expect(r.daysLeftInWindow).toBe(39);
  });

  it("moves frost-sensitive crops to 'protect' when frost is forecast, but not hardy ones", () => {
    const frost: WeatherAlert[] = [{ kind: "frost", severity: "warning", date: "2026-11-03", title: "", message: "" }];
    const base = { crops: SEED_CROPS, today: "2026-10-20", zone: "jordan_valley" as const, spaceType: "home_garden" as const, alerts: frost };
    const t = recommendCrop(tomato, base);
    expect(t.status).toBe("protect");
    expect(t.warnings.join(" ")).toContain("حساس للصقيع");
    expect(recommendCrop(garlic, base).status).toBe("now");
    // A greenhouse protects from light frost, so no downgrade there.
    expect(recommendCrop(tomato, { ...base, spaceType: "greenhouse" }).status).toBe("now");
  });

  it("flags unsuitable spaces as needing special care", () => {
    const r = recommendCrop(olive, { crops: SEED_CROPS, today: "2027-01-10", zone: "highland", spaceType: "balcony" });
    expect(r.status).toBe("protect");
    expect(r.spaceSuitable).toBe(false);
    expect(r.reasons.join(" ")).toContain("شرفة");
  });

  it("filters by planting method", () => {
    const base = { crops: SEED_CROPS, today: "2026-10-20", zone: "highland" as const, spaceType: "home_garden" as const };
    expect(recommendCrop(garlic, { ...base, methodGroup: "tubers" }).status).toBe("now");
    expect(recommendCrop(garlic, { ...base, methodGroup: "seeds" }).status).toBe("no_data");
  });

  it("orders results deterministically", () => {
    const input = { crops: SEED_CROPS, today: "2026-11-01", zone: "highland" as const, spaceType: "home_garden" as const };
    const a = recommendCrops(input).items.map((i) => i.crop.slug);
    const b = recommendCrops({ ...input, crops: [...SEED_CROPS].reverse() }).items.map((i) => i.crop.slug);
    expect(a).toEqual(b);
    const statuses = recommendCrops(input).items.map((i) => i.status);
    const order = ["now", "protect", "soon", "later", "no_data"];
    expect([...statuses].sort((x, y) => order.indexOf(x) - order.indexOf(y))).toEqual(statuses);
    const later = recommendCrops(input).groups.later;
    for (let i = 1; i < later.length; i++) expect(compareRecommendations(later[i - 1], later[i])).toBeLessThanOrEqual(0);
  });

  it("returns upcoming windows for the empty state", () => {
    const res = recommendCrops({ crops: [tomato], today: "2026-07-01", zone: "highland", spaceType: "home_garden" });
    expect(res.groups.now).toHaveLength(0);
    expect(upcomingStarts(res)[0].crop.slug).toBe("tomato");
    expect(SOON_DAYS).toBe(45);
  });

  it("explains the greenhouse fallback", () => {
    const res = recommendCrops({ crops: SEED_CROPS, today: "2026-11-01", zone: "coastal", spaceType: "greenhouse" });
    expect(res.notices[0]).toContain("البيوت المحمية");
  });
});
