/**
 * Geography helpers for locating a farm precisely. Pure functions (no browser
 * APIs) so the rules are unit-tested.
 *
 * Climate-zone suggestion is a transparent rule set, not a model:
 *   1. below sea level in the Jordan Rift → «غور / منخفض حار»
 *   2. ≥ 350 m elevation → «جبلي / مرتفعات»
 *   3. within 15 km of the Mediterranean coast and < 200 m → «ساحلي»
 *   4. southern or eastern dry belt → «صحراوي / شبه جاف»
 *   5. otherwise → «سهلي داخلي»
 * Without a reliable elevation it falls back to the nearest listed town's zone
 * and says so. The user can always correct the zone manually.
 */
import type { ClimateZone } from "./types";

export interface LatLon {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_KM = 6371;
const toRad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in kilometres. */
export function distanceKm(a: LatLon, b: LatLon): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Simplified eastern-Mediterranean shoreline (Rafah → Latakia), approximate
 * points along the coast. Only used to estimate "distance from the sea".
 */
export const LEVANT_COASTLINE: [number, number][] = [
  [31.32, 34.22],
  [31.36, 34.27],
  [31.42, 34.33],
  [31.52, 34.43],
  [31.56, 34.49],
  [31.67, 34.55],
  [31.8, 34.63],
  [32.05, 34.75],
  [32.33, 34.85],
  [32.44, 34.88],
  [32.82, 34.96],
  [32.93, 35.07],
  [33.12, 35.14],
  [33.27, 35.19],
  [33.56, 35.37],
  [33.9, 35.48],
  [34.12, 35.64],
  [34.45, 35.81],
  [34.89, 35.88],
  [35.52, 35.77],
];

/** Distance (km) from a point to the simplified coastline polyline. */
export function distanceToCoastKm(p: LatLon): number {
  // Local equirectangular projection is accurate enough at this scale.
  const kx = 111.32 * Math.cos(toRad(p.latitude));
  const ky = 110.57;
  let best = Infinity;
  for (let i = 0; i < LEVANT_COASTLINE.length - 1; i++) {
    const [aLat, aLon] = LEVANT_COASTLINE[i];
    const [bLat, bLon] = LEVANT_COASTLINE[i + 1];
    const ax = (aLon - p.longitude) * kx;
    const ay = (aLat - p.latitude) * ky;
    const bx = (bLon - p.longitude) * kx;
    const by = (bLat - p.latitude) * ky;
    const dx = bx - ax;
    const dy = by - ay;
    const t = Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy)));
    const cx = ax + t * dx;
    const cy = ay + t * dy;
    best = Math.min(best, Math.hypot(cx, cy));
  }
  return best;
}

/** True when the point lies in the area this platform's data covers. */
export function isInLevant(p: LatLon): boolean {
  return p.latitude >= 29 && p.latitude <= 37.5 && p.longitude >= 34 && p.longitude <= 42.5;
}

export type ZoneBasis = "elevation" | "nearest_town";

export interface ZoneSuggestion {
  zone: ClimateZone;
  basis: ZoneBasis;
  /** Arabic explanation shown next to the suggestion. */
  reason: string;
}

export const HIGHLAND_MIN_ELEVATION_M = 350;
export const COASTAL_MAX_DISTANCE_KM = 15;
export const COASTAL_MAX_ELEVATION_M = 200;

export function suggestZone(
  p: LatLon,
  elevationM: number | null,
  nearestTown: { name: string; zone: ClimateZone } | null,
): ZoneSuggestion | null {
  if (elevationM == null || !Number.isFinite(elevationM)) {
    if (!nearestTown) return null;
    return {
      zone: nearestTown.zone,
      basis: "nearest_town",
      reason: `لم يتوفر ارتفاع موثوق لهذه النقطة، فاقترحنا منطقة أقرب بلدة في قائمتنا (${nearestTown.name}). صحّحها إن كانت أرضك مختلفة.`,
    };
  }
  const m = Math.round(elevationM);
  const coastKm = distanceToCoastKm(p);
  // 1. Below sea level inside the Jordan Rift (Jordan Valley, Dead Sea, Tiberias basin).
  if (elevationM <= 0 && p.longitude >= 35.3 && p.longitude <= 35.9) {
    return { zone: "jordan_valley", basis: "elevation", reason: `الارتفاع نحو ${m} م تحت سطح البحر في منطقة الأغوار.` };
  }
  // 2. Mountains and plateaus.
  if (elevationM >= HIGHLAND_MIN_ELEVATION_M) {
    return { zone: "highland", basis: "elevation", reason: `الارتفاع نحو ${m} م فوق سطح البحر (مرتفعات).` };
  }
  // 3. Coastal strip.
  if (coastKm <= COASTAL_MAX_DISTANCE_KM && elevationM < COASTAL_MAX_ELEVATION_M) {
    return {
      zone: "coastal",
      basis: "elevation",
      reason: `على بعد نحو ${Math.round(coastKm)} كم من البحر وبارتفاع ${m} م.`,
    };
  }
  // 4. Dry south (Naqab / southern Gaza hinterland) and the eastern steppe.
  if ((p.latitude < 31.35 && coastKm > 20) || (p.longitude > 36.0 && p.latitude < 32.6)) {
    return { zone: "arid", basis: "elevation", reason: `منطقة جافة بعيدة عن البحر (نحو ${Math.round(coastKm)} كم) وارتفاع ${m} م.` };
  }
  // 5. Low inland plains.
  return {
    zone: "inland_plain",
    basis: "elevation",
    reason: `سهل داخلي بارتفاع ${m} م وعلى بعد نحو ${Math.round(coastKm)} كم من البحر.`,
  };
}

export type AccuracyLevel = "high" | "medium" | "low" | "very_low";

/** Accuracy radius (metres, 68% confidence as reported by the browser). */
export function accuracyLevel(accuracyM: number): AccuracyLevel {
  if (accuracyM <= 50) return "high";
  if (accuracyM <= 250) return "medium";
  if (accuracyM <= 2000) return "low";
  return "very_low";
}

/** GPS accuracy at which we stop waiting for a better fix. */
export const GOOD_ENOUGH_ACCURACY_M = 30;

/**
 * Rounds coordinates before they leave the device (weather/elevation lookups).
 * Two decimals ≈ 1 km — finer than the weather models' grid, so the forecast is
 * unchanged while the exact field/house position stays private.
 */
export function roundForService(p: LatLon, decimals = 2): LatLon {
  const f = 10 ** decimals;
  return { latitude: Math.round(p.latitude * f) / f, longitude: Math.round(p.longitude * f) / f };
}

export function formatCoordinate(value: number, axis: "lat" | "lon"): string {
  const abs = Math.abs(value).toFixed(5);
  if (axis === "lat") return `${abs}° ${value >= 0 ? "شمالًا" : "جنوبًا"}`;
  return `${abs}° ${value >= 0 ? "شرقًا" : "غربًا"}`;
}

export function formatAccuracy(m: number): string {
  if (m < 1000) return `± ${Math.round(m)} م`;
  return `± ${(m / 1000).toFixed(1)} كم`;
}
