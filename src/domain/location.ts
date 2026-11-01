/**
 * The user's confirmed farm location (v2). Stored locally (guest) or on the
 * user's own profile row (signed in). Pure helpers, unit-tested.
 */
import { findRegion, nearestRegion } from "@/data/regions";
import { roundForService, type LatLon } from "./geo";
import { CLIMATE_ZONES, type ClimateZone } from "./types";

export type LocationSource = "gps" | "map" | "search" | "list";
export type ZoneSource = "manual" | "elevation" | "nearest_town" | "list";

export interface SavedLocation {
  version: 2;
  source: LocationSource;
  latitude: number;
  longitude: number;
  /** GPS accuracy radius in metres (gps only). */
  accuracyM: number | null;
  /** What the user sees: village/area name, or a coordinate description. */
  label: string;
  /** Nearest listed town — for grouping and fallbacks only, never shown as "your location". */
  regionId: string | null;
  zone: ClimateZone;
  zoneSource: ZoneSource;
  elevationM: number | null;
  timezone: string;
  /** Consent to send (rounded) coordinates to OpenStreetMap / Open-Meteo. */
  externalConsent: boolean;
  confirmedAt: string;
}

export const LOCATION_SOURCE_LABELS: Record<LocationSource, string> = {
  gps: "تحديد GPS",
  map: "اختيار يدوي على الخريطة",
  search: "بحث عن مكان",
  list: "اختيار من قائمة المدن",
};

export const ZONE_SOURCE_LABELS: Record<ZoneSource, string> = {
  manual: "حددتها يدويًا",
  elevation: "مقترحة حسب الارتفاع والموقع",
  nearest_town: "مقترحة حسب أقرب بلدة (دون بيانات ارتفاع)",
  list: "حسب المدينة المختارة",
};

/** GPS and map pins can point at someone's home or field: they need consent before leaving the device. */
export function isPrecise(loc: Pick<SavedLocation, "source">): boolean {
  return loc.source === "gps" || loc.source === "map";
}

/**
 * Coordinates allowed to be sent to an external service (weather/elevation),
 * or null when the user has not consented for a precise location.
 */
export function coordsForServices(loc: SavedLocation | null): LatLon | null {
  if (!loc) return null;
  if (isPrecise(loc) && !loc.externalConsent) return null;
  return isPrecise(loc) ? roundForService(loc) : { latitude: loc.latitude, longitude: loc.longitude };
}

function isZone(v: unknown): v is ClimateZone {
  return typeof v === "string" && (CLIMATE_ZONES as readonly string[]).includes(v);
}

/** Accepts v2 objects and upgrades the old v1 shape {regionId, zone, latitude, longitude, timezone}. */
export function normalizeLocation(raw: unknown): SavedLocation | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const lat = typeof r.latitude === "number" ? r.latitude : null;
  const lon = typeof r.longitude === "number" ? r.longitude : null;
  if (r.version === 2) {
    if (lat == null || lon == null || !isZone(r.zone)) return null;
    return raw as SavedLocation;
  }
  // v1
  const region = findRegion(typeof r.regionId === "string" ? r.regionId : null);
  const latitude = lat ?? region?.latitude;
  const longitude = lon ?? region?.longitude;
  if (latitude == null || longitude == null) return null;
  const near = region ?? nearestRegion(latitude, longitude);
  return {
    version: 2,
    source: "list",
    latitude,
    longitude,
    accuracyM: null,
    label: near.name,
    regionId: near.id,
    zone: isZone(r.zone) ? r.zone : near.zone,
    zoneSource: isZone(r.zone) && r.zone !== near.zone ? "manual" : "list",
    elevationM: null,
    timezone: typeof r.timezone === "string" && r.timezone ? r.timezone : near.timezone,
    externalConsent: false,
    confirmedAt: new Date(0).toISOString(),
  };
}
