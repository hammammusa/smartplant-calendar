import type { ClimateZone, Crop, PlantingWindow, Season } from "./types";
import { SEASON_MONTHS } from "./labels";

/** True when `month` lies within a window that may wrap the year end. */
export function monthInWindow(month: number, start: number, end: number): boolean {
  if (start <= end) return month >= start && month <= end;
  return month >= start || month <= end;
}

/** Circular distance in months between two months (0–6). */
export function monthDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 12;
  return Math.min(d, 12 - d);
}

export function windowsForZone(crop: Pick<Crop, "windows">, zone: ClimateZone): PlantingWindow[] {
  return crop.windows.filter((w) => w.zone === zone);
}

export type WindowFit = "in_window" | "near_window" | "outside_window" | "no_data";

/**
 * How well a planting month matches the crop's preliminary windows for a zone.
 * "near" means within one month of a window edge.
 */
export function evaluateWindowFit(crop: Pick<Crop, "windows">, zone: ClimateZone, month: number): WindowFit {
  const windows = windowsForZone(crop, zone);
  if (windows.length === 0) return "no_data";
  if (windows.some((w) => monthInWindow(month, w.startMonth, w.endMonth))) return "in_window";
  const near = windows.some(
    (w) => monthDistance(month, w.startMonth) <= 1 || monthDistance(month, w.endMonth) <= 1,
  );
  return near ? "near_window" : "outside_window";
}

/** Crops that have at least one window in the given season (any zone, or a given zone). */
export function cropMatchesSeason(crop: Pick<Crop, "windows">, season: Season, zone?: ClimateZone): boolean {
  const months = SEASON_MONTHS[season];
  return crop.windows
    .filter((w) => !zone || w.zone === zone)
    .some((w) => months.some((m) => monthInWindow(m, w.startMonth, w.endMonth)));
}

export function cropPlantableInMonth(crop: Pick<Crop, "windows">, month: number, zone: ClimateZone): boolean {
  return windowsForZone(crop, zone).some((w) => monthInWindow(month, w.startMonth, w.endMonth));
}
