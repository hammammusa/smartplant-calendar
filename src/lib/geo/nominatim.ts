"use client";

/**
 * OpenStreetMap Nominatim (https://nominatim.org) — used only after the user
 * consents, and only on explicit actions (pressing "search" or "find place
 * name"), never as autocomplete, per the usage policy:
 * https://operations.osmfoundation.org/policies/nominatim/
 *   - max 1 request per second (enforced below),
 *   - results cached locally (7 days),
 *   - attribution «© مساهمو OpenStreetMap» shown wherever results appear.
 * Browsers send the site's Referer, which identifies the application.
 */
import type { LatLon } from "@/domain/geo";

const ENDPOINT = "https://nominatim.openstreetmap.org";
const CACHE_PREFIX = "smartplant:nominatim:";
const CACHE_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_INTERVAL_MS = 1100;
let lastRequestAt = 0;

export interface Place extends LatLon {
  /** Short Arabic label: village/town, then district. */
  label: string;
  /** Full display name as returned by OSM. */
  displayName: string;
  osmType?: string;
}

interface NominatimItem {
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  osm_type?: string;
  address?: Record<string, string>;
}

function readCache<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { at, value } = JSON.parse(raw) as { at: number; value: T };
    return Date.now() - at < CACHE_MS ? value : null;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ at: Date.now(), value }));
  } catch {
    /* storage unavailable */
  }
}

async function throttle() {
  const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

function shortLabel(item: NominatimItem): string {
  const a = item.address ?? {};
  const local = a.village ?? a.hamlet ?? a.town ?? a.city ?? a.suburb ?? a.neighbourhood ?? a.municipality ?? item.name;
  const district = a.county ?? a.state_district ?? a.state;
  const parts = [local, district && district !== local ? district : null].filter(Boolean);
  return parts.length ? parts.join("، ") : item.display_name.split(",").slice(0, 2).join("،");
}

function toPlace(item: NominatimItem): Place {
  return {
    latitude: Number(item.lat),
    longitude: Number(item.lon),
    label: shortLabel(item),
    displayName: item.display_name,
    osmType: item.osm_type,
  };
}

export class GeocodeError extends Error {}

/** Place name for a point (village/neighbourhood level). */
export async function reverseGeocode(p: LatLon): Promise<Place | null> {
  const key = `rev:${p.latitude.toFixed(4)},${p.longitude.toFixed(4)}`;
  const cached = readCache<Place | null>(key);
  if (cached !== null) return cached;
  await throttle();
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: p.latitude.toFixed(5),
    lon: p.longitude.toFixed(5),
    zoom: "14",
    addressdetails: "1",
    "accept-language": "ar",
  });
  let res: Response;
  try {
    res = await fetch(`${ENDPOINT}/reverse?${params}`, { signal: AbortSignal.timeout(10_000) });
  } catch {
    throw new GeocodeError("network");
  }
  if (!res.ok) throw new GeocodeError(`status ${res.status}`);
  const json = (await res.json()) as NominatimItem & { error?: string };
  const place = json.error ? null : toPlace(json);
  writeCache(key, place);
  return place;
}

/** Search triggered by an explicit submit (never per keystroke). */
export async function searchPlaces(query: string): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const key = `search:${q}`;
  const cached = readCache<Place[]>(key);
  if (cached) return cached;
  await throttle();
  const params = new URLSearchParams({
    format: "jsonv2",
    q,
    limit: "8",
    addressdetails: "1",
    "accept-language": "ar",
    // Bias to the Levant; results elsewhere are still allowed.
    viewbox: "34.0,37.5,42.5,29.0",
    countrycodes: "ps,jo,lb,sy,il",
  });
  let res: Response;
  try {
    res = await fetch(`${ENDPOINT}/search?${params}`, { signal: AbortSignal.timeout(10_000) });
  } catch {
    throw new GeocodeError("network");
  }
  if (!res.ok) throw new GeocodeError(`status ${res.status}`);
  const places = ((await res.json()) as NominatimItem[]).map(toPlace);
  writeCache(key, places);
  return places;
}
