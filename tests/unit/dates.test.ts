import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  diffDays,
  isValidISODate,
  monthGrid,
  startOfWeek,
  todayInTimeZone,
  weekday,
} from "@/lib/dates";
import { formatDate, formatDays, formatMonthRange, relativeDay } from "@/lib/format";

describe("date helpers", () => {
  it("validates ISO dates including leap years", () => {
    expect(isValidISODate("2028-02-29")).toBe(true);
    expect(isValidISODate("2027-02-29")).toBe(false);
    expect(isValidISODate("2026-13-01")).toBe(false);
    expect(isValidISODate("2026-4-1")).toBe(false);
  });

  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("is not affected by daylight-saving transitions", () => {
    // Palestine switches clocks in spring/autumn; date-only maths must not drift.
    expect(addDays("2026-03-27", 1)).toBe("2026-03-28");
    expect(diffDays("2026-03-20", "2026-04-05")).toBe(16);
    expect(diffDays("2026-10-20", "2026-11-05")).toBe(16);
  });

  it("adds months with day clamping", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-11-15", 3)).toBe("2027-02-15");
    expect(addMonths("2026-01-15", -1)).toBe("2025-12-15");
  });

  it("starts weeks on Saturday by default", () => {
    // 2026-10-27 is a Tuesday.
    expect(weekday("2026-10-27")).toBe(2);
    expect(startOfWeek("2026-10-27")).toBe("2026-10-24");
    expect(weekday(startOfWeek("2026-10-27"))).toBe(6);
  });

  it("builds a 42-day month grid containing the whole month", () => {
    const grid = monthGrid("2026-02-10");
    expect(grid).toHaveLength(42);
    expect(grid).toContain("2026-02-01");
    expect(grid).toContain("2026-02-28");
    expect(weekday(grid[0])).toBe(6);
  });

  it("resolves today in Asia/Hebron rather than UTC", () => {
    // 22:30 UTC on 27 Oct 2026 is already 28 Oct in Palestine (UTC+2 in winter time).
    const now = new Date("2026-10-27T22:30:00Z");
    expect(todayInTimeZone("Asia/Hebron", now)).toBe("2026-10-28");
    expect(todayInTimeZone("UTC", now)).toBe("2026-10-27");
    expect(todayInTimeZone("Not/AZone", now)).toBe("2026-10-28");
  });
});

describe("Arabic formatting", () => {
  it("uses Levant month names", () => {
    expect(formatDate("2026-10-27", { weekday: true })).toBe("الثلاثاء 27 تشرين الأول 2026");
    expect(formatDate("2026-04-14", { year: false })).toBe("14 نيسان");
    expect(formatMonthRange(9, 11)).toBe("أيلول – تشرين الثاني");
  });

  it("pluralises days correctly", () => {
    expect(formatDays(1)).toBe("يوم واحد");
    expect(formatDays(2)).toBe("يومان");
    expect(formatDays(5)).toBe("5 أيام");
    expect(formatDays(15)).toBe("15 يومًا");
    expect(relativeDay(1)).toBe("غدًا");
    expect(relativeDay(-3)).toBe("منذ 3 أيام");
  });
});
