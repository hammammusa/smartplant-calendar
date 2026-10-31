/**
 * Weather model + agricultural alert rules. Alerts are informational: they
 * never claim a plant "needs water" from temperature alone.
 */
import type { ISODate } from "./types";

export interface DailyForecast {
  date: ISODate;
  weatherCode: number;
  tempMax: number | null;
  tempMin: number | null;
  precipitationProbability: number | null;
  precipitationSum: number | null;
  windSpeedMax: number | null;
}

export interface WeatherForecast {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    time: string;
    temperature: number | null;
    apparentTemperature: number | null;
    humidity: number | null;
    windSpeed: number | null;
    weatherCode: number;
    isDay: boolean;
  };
  daily: DailyForecast[];
  source: "Open-Meteo";
  fetchedAt: string;
}

export interface WeatherThresholds {
  frostTempC: number;
  heatTempC: number;
  rainProbabilityPct: number;
  heavyRainMm: number;
  strongWindKmh: number;
}

export const DEFAULT_THRESHOLDS: WeatherThresholds = {
  frostTempC: 2,
  heatTempC: 35,
  rainProbabilityPct: 60,
  heavyRainMm: 20,
  strongWindKmh: 40,
};

export type AlertKind = "frost" | "heat" | "rain" | "heavy_rain" | "wind";

export interface WeatherAlert {
  kind: AlertKind;
  severity: "warning" | "info";
  date: ISODate;
  title: string;
  message: string;
}

export function deriveAlerts(daily: DailyForecast[], th: WeatherThresholds = DEFAULT_THRESHOLDS): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  for (const d of daily) {
    if (d.tempMin != null && d.tempMin <= th.frostTempC) {
      alerts.push({
        kind: "frost",
        severity: "warning",
        date: d.date,
        title: "احتمال صقيع",
        message: `يُتوقع أن تنخفض الحرارة إلى ${Math.round(d.tempMin)}° تقريبًا. غطِّ الأشتال الحساسة ليلًا وانقل الأصص إلى مكان محمي.`,
      });
    }
    if (d.tempMax != null && d.tempMax >= th.heatTempC) {
      alerts.push({
        kind: "heat",
        severity: "warning",
        date: d.date,
        title: "حرارة مرتفعة",
        message: `قد تصل الحرارة إلى ${Math.round(d.tempMax)}°. فكّر في التظليل وتجنّب الشتل والتسميد وقت الظهيرة، وافحص رطوبة التربة صباحًا قبل أن تقرر الري.`,
      });
    }
    if (d.precipitationSum != null && d.precipitationSum >= th.heavyRainMm) {
      alerts.push({
        kind: "heavy_rain",
        severity: "warning",
        date: d.date,
        title: "أمطار غزيرة محتملة",
        message: "تأكد من تصريف المياه في الأحواض والأصص، وأجّل التسميد حتى لا يُغسل.",
      });
    } else if (d.precipitationProbability != null && d.precipitationProbability >= th.rainProbabilityPct) {
      alerts.push({
        kind: "rain",
        severity: "info",
        date: d.date,
        title: "احتمال أمطار",
        message: `احتمال الهطول نحو ${Math.round(d.precipitationProbability)}٪. قد تستطيع تأجيل الري المجدول بعد التحقق من رطوبة التربة.`,
      });
    }
    if (d.windSpeedMax != null && d.windSpeedMax >= th.strongWindKmh) {
      alerts.push({
        kind: "wind",
        severity: "info",
        date: d.date,
        title: "رياح قوية",
        message: "ثبّت الدعامات والأغطية، وانقل الأصص الخفيفة من حواف الأسطح والشرفات.",
      });
    }
  }
  return alerts;
}

/** WMO weather interpretation codes → Arabic description + icon key. */
export function describeWeatherCode(code: number): { label: string; icon: WeatherIcon } {
  if (code === 0) return { label: "صحو", icon: "sun" };
  if (code === 1) return { label: "صحو غالبًا", icon: "sun" };
  if (code === 2) return { label: "غائم جزئيًا", icon: "cloud-sun" };
  if (code === 3) return { label: "غائم", icon: "cloud" };
  if (code === 45 || code === 48) return { label: "ضباب", icon: "fog" };
  if (code >= 51 && code <= 57) return { label: "رذاذ", icon: "drizzle" };
  if (code >= 61 && code <= 67) return { label: "أمطار", icon: "rain" };
  if (code >= 71 && code <= 77) return { label: "ثلوج", icon: "snow" };
  if (code >= 80 && code <= 82) return { label: "زخات مطر", icon: "rain" };
  if (code === 85 || code === 86) return { label: "زخات ثلج", icon: "snow" };
  if (code >= 95 && code <= 99) return { label: "عواصف رعدية", icon: "storm" };
  return { label: "غير محدد", icon: "cloud" };
}

export type WeatherIcon = "sun" | "cloud-sun" | "cloud" | "fog" | "drizzle" | "rain" | "snow" | "storm";
