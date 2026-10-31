import "server-only";
import type { DailyForecast, WeatherForecast } from "@/domain/weather";

/**
 * Open-Meteo's free endpoint is for non-commercial use. For commercial use set
 * OPEN_METEO_API_KEY (server-only) to switch to the customer endpoint.
 */
const API_KEY = process.env.OPEN_METEO_API_KEY ?? "";
const ENDPOINT = API_KEY
  ? "https://customer-api.open-meteo.com/v1/forecast"
  : "https://api.open-meteo.com/v1/forecast";
export const FORECAST_DAYS = 7;

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current?: {
    time: string;
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    weather_code?: number;
    is_day?: number;
  };
  daily?: {
    time: string[];
    weather_code?: (number | null)[];
    temperature_2m_max?: (number | null)[];
    temperature_2m_min?: (number | null)[];
    precipitation_probability_max?: (number | null)[];
    precipitation_sum?: (number | null)[];
    wind_speed_10m_max?: (number | null)[];
  };
}

export class WeatherUnavailableError extends Error {}

/** Fetches a short forecast from Open-Meteo (cached for 30 minutes). */
export async function fetchForecast(lat: number, lon: number, timezone: string): Promise<WeatherForecast> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    timezone,
    forecast_days: String(FORECAST_DAYS),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max",
  });
  if (API_KEY) params.set("apikey", API_KEY);

  let res: Response;
  try {
    res = await fetch(`${ENDPOINT}?${params}`, {
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    throw new WeatherUnavailableError(`network: ${(err as Error).message}`);
  }
  if (!res.ok) throw new WeatherUnavailableError(`status ${res.status}`);
  const json = (await res.json()) as OpenMeteoResponse;
  const d = json.daily;
  const daily: DailyForecast[] = (d?.time ?? []).map((date, i) => ({
    date,
    weatherCode: d?.weather_code?.[i] ?? -1,
    tempMax: d?.temperature_2m_max?.[i] ?? null,
    tempMin: d?.temperature_2m_min?.[i] ?? null,
    precipitationProbability: d?.precipitation_probability_max?.[i] ?? null,
    precipitationSum: d?.precipitation_sum?.[i] ?? null,
    windSpeedMax: d?.wind_speed_10m_max?.[i] ?? null,
  }));
  const c = json.current;
  return {
    latitude: json.latitude,
    longitude: json.longitude,
    timezone: json.timezone,
    current: {
      time: c?.time ?? "",
      temperature: c?.temperature_2m ?? null,
      apparentTemperature: c?.apparent_temperature ?? null,
      humidity: c?.relative_humidity_2m ?? null,
      windSpeed: c?.wind_speed_10m ?? null,
      weatherCode: c?.weather_code ?? -1,
      isDay: c?.is_day !== 0,
    },
    daily,
    source: "Open-Meteo",
    fetchedAt: new Date().toISOString(),
  };
}
