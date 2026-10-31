"use client";

import { buildForecastUrl, mapForecast, type OpenMeteoResponse } from "@/domain/open-meteo";
import { DEFAULT_THRESHOLDS, deriveAlerts, type WeatherAlert, type WeatherForecast, type WeatherThresholds } from "@/domain/weather";
import { getBrowserSupabase } from "@/lib/supabase/client";

export interface WeatherPayload {
  forecast: WeatherForecast;
  alerts: WeatherAlert[];
}

export type WeatherResult = { status: "ok"; data: WeatherPayload } | { status: "error"; message: string };

const CACHE_MS = 30 * 60 * 1000;
let thresholdsPromise: Promise<WeatherThresholds> | null = null;

/** Admin-configured alert thresholds (public read via RLS), falling back to defaults. */
function loadThresholds(): Promise<WeatherThresholds> {
  thresholdsPromise ??= (async () => {
    const supabase = getBrowserSupabase();
    if (!supabase) return DEFAULT_THRESHOLDS;
    const { data } = await supabase.from("site_settings").select("value").eq("key", "weather_thresholds").maybeSingle();
    return { ...DEFAULT_THRESHOLDS, ...((data?.value as Partial<WeatherThresholds>) ?? {}) };
  })().catch(() => DEFAULT_THRESHOLDS);
  return thresholdsPromise;
}

function readCache(key: string): WeatherForecast | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeatherForecast;
    return Date.now() - new Date(parsed.fetchedAt).getTime() < CACHE_MS ? parsed : null;
  } catch {
    return null;
  }
}

/** Fetches the forecast straight from Open-Meteo (no backend needed) with a 30-minute session cache. */
export async function fetchWeather(lat: number, lon: number, tz: string): Promise<WeatherResult> {
  if (!navigator.onLine) {
    return { status: "error", message: "لا يوجد اتصال بالإنترنت، لذلك لا يمكن تحديث بيانات الطقس الآن." };
  }
  const key = `smartplant:weather:${lat.toFixed(3)},${lon.toFixed(3)},${tz}`;
  try {
    let forecast = readCache(key);
    if (!forecast) {
      const res = await fetch(buildForecastUrl(lat, lon, tz), { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`status ${res.status}`);
      forecast = mapForecast((await res.json()) as OpenMeteoResponse, new Date().toISOString());
      try {
        window.sessionStorage.setItem(key, JSON.stringify(forecast));
      } catch {
        /* storage unavailable: skip caching */
      }
    }
    const thresholds = await loadThresholds();
    return { status: "ok", data: { forecast, alerts: deriveAlerts(forecast.daily, thresholds) } };
  } catch {
    return {
      status: "error",
      message: "تعذّر الحصول على بيانات الطقس حاليًا. سنحاول مرة أخرى لاحقًا، وبقية المنصة تعمل بشكل طبيعي.",
    };
  }
}
