/**
 * Open-Meteo request/response mapping. Pure functions, shared by the browser
 * client and the unit tests.
 *
 * Open-Meteo's free endpoint allows cross-origin browser requests and needs no
 * key, but is intended for non-commercial use. A paid key must never be put in
 * the static bundle; commercial deployments should proxy requests through a
 * small backend (see README).
 */
import type { DailyForecast, WeatherForecast } from "./weather";

export const OPEN_METEO_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
export const FORECAST_DAYS = 7;

export interface OpenMeteoResponse {
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

export function buildForecastUrl(lat: number, lon: number, timezone: string): string {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    timezone,
    forecast_days: String(FORECAST_DAYS),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max",
  });
  return `${OPEN_METEO_ENDPOINT}?${params}`;
}

export function mapForecast(json: OpenMeteoResponse, fetchedAt: string): WeatherForecast {
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
    fetchedAt,
  };
}
