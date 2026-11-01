"use client";

/**
 * Terrain elevation from Open-Meteo's Elevation API (Copernicus DEM GLO-90,
 * ~90 m resolution). Called only after consent, with coordinates rounded to
 * ~100 m. Cached per rounded point.
 */
import type { LatLon } from "@/domain/geo";

const CACHE_PREFIX = "smartplant:elevation:";

export async function fetchElevation(p: LatLon): Promise<number | null> {
  const lat = p.latitude.toFixed(3);
  const lon = p.longitude.toFixed(3);
  const key = CACHE_PREFIX + `${lat},${lon}`;
  try {
    const cached = window.localStorage.getItem(key);
    if (cached !== null) return Number(cached);
  } catch {
    /* ignore */
  }
  try {
    const res = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { elevation?: number[] };
    const value = json.elevation?.[0];
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    try {
      window.localStorage.setItem(key, String(value));
    } catch {
      /* ignore */
    }
    return value;
  } catch {
    return null;
  }
}
