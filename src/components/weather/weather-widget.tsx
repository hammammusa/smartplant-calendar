"use client";

import {
  AlertTriangle,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Droplets,
  MapPin,
  RefreshCw,
  Sun,
  Wind,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { coordsForServices } from "@/domain/location";
import { describeWeatherCode, type WeatherIcon } from "@/domain/weather";
import { fetchWeather, type WeatherPayload, type WeatherResult } from "@/lib/weather-client";
import { formatDate, formatDateTime, formatNumber, WEEKDAYS } from "@/lib/format";
import { weekday } from "@/lib/dates";
import { cn } from "@/lib/utils";

const ICONS: Record<WeatherIcon, LucideIcon> = {
  sun: Sun,
  "cloud-sun": CloudSun,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
};

type Loaded = WeatherResult;
type State = { status: "loading" } | Loaded;

const t = (v: number | null) => (v == null ? "—" : `${formatNumber(Math.round(v), 0)}°`);

export function useWeather() {
  const { location, mode } = useAppData();
  // Real (rounded) coordinates of the confirmed location — only with consent for GPS/map points.
  const coords = coordsForServices(location);
  const lat = coords?.latitude ?? null;
  const lon = coords?.longitude ?? null;
  const tz = location?.timezone ?? "Asia/Hebron";
  const key = `${lat},${lon},${tz}`;
  const [result, setResult] = useState<{ key: string; value: Loaded } | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (mode === "loading" || lat == null || lon == null) return;
    let cancelled = false;
    fetchWeather(lat, lon, tz).then((value) => {
      if (!cancelled) setResult({ key: `${key}#${nonce}`, value });
    });
    return () => {
      cancelled = true;
    };
  }, [lat, lon, tz, key, nonce, mode]);

  const state: State = result && result.key === `${key}#${nonce}` ? result.value : { status: "loading" };
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return {
    state,
    reload,
    hasLocation: lat != null && lon != null,
    needsConsent: !!location && coords === null,
    placeName: location?.label ?? null,
    timezone: tz,
  };
}

function NeedsConsent() {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="flex items-center gap-2 font-bold"><MapPin className="size-5 text-brand-600" aria-hidden /> الطقس يحتاج موافقتك</p>
      <p className="text-sm text-muted-foreground">موقعك المحفوظ دقيق (GPS أو خريطة)، ولن نرسله إلى خدمة الطقس دون موافقتك. فعّل الموافقة من صفحة الموقع.</p>
      <Button asChild size="sm" variant="outline"><Link href="/location">الموافقة من صفحة الموقع</Link></Button>
    </div>
  );
}

function NoLocation() {
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="flex items-center gap-2 font-bold"><MapPin className="size-5 text-brand-600" aria-hidden /> حدّد موقعك لعرض الطقس</p>
      <p className="text-sm text-muted-foreground">حدّد موقع أرضك لنعرض لك توقعات الطقس المحلية.</p>
      <Button asChild size="sm" variant="outline"><Link href="/location">تحديد الموقع</Link></Button>
    </div>
  );
}

function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3">
      <p className="flex items-center gap-2 font-bold text-warning"><AlertTriangle className="size-5" aria-hidden /> الطقس غير متاح الآن</p>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button size="sm" variant="outline" onClick={onRetry}><RefreshCw /> إعادة المحاولة</Button>
    </div>
  );
}

/** Compact card for the dashboard. */
export function WeatherCard() {
  const { state, reload, hasLocation, needsConsent, placeName, timezone } = useWeather();
  return (
    <section aria-labelledby="weather-card" className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="weather-card" className="font-bold">الطقس{placeName ? ` في ${placeName}` : ""}</h2>
        <Link href="/weather" className="text-sm font-semibold text-brand-600 hover:underline">التفاصيل</Link>
      </div>
      {needsConsent ? (
        <NeedsConsent />
      ) : !hasLocation ? (
        <NoLocation />
      ) : state.status === "error" ? (
        <ErrorBox message={state.message} onRetry={reload} />
      ) : state.status !== "ok" ? (
        <div role="status" aria-label="جارٍ تحميل الطقس" className="space-y-3">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <WeatherSummary data={state.data} timezone={timezone} compact />
      )}
    </section>
  );
}

function WeatherSummary({ data, timezone, compact }: { data: WeatherPayload; timezone: string; compact?: boolean }) {
  const { forecast, alerts } = data;
  const cur = describeWeatherCode(forecast.current.weatherCode);
  const Icon = ICONS[cur.icon];
  const days = compact ? forecast.daily.slice(0, 4) : forecast.daily;
  const shownAlerts = compact ? alerts.slice(0, 2) : alerts;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Icon className="size-12 text-lime-600" aria-hidden />
        <div>
          <p className="text-4xl font-extrabold">{t(forecast.current.temperature)}</p>
          <p className="text-sm text-muted-foreground">{cur.label}</p>
        </div>
        <dl className="ms-auto space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5"><Droplets className="size-4" aria-hidden /><dt className="sr-only">الرطوبة</dt><dd>رطوبة {forecast.current.humidity == null ? "—" : `${formatNumber(forecast.current.humidity, 0)}٪`}</dd></div>
          <div className="flex items-center gap-1.5"><Wind className="size-4" aria-hidden /><dt className="sr-only">الرياح</dt><dd>{forecast.current.windSpeed == null ? "—" : `${formatNumber(forecast.current.windSpeed, 0)} كم/س`}</dd></div>
        </dl>
      </div>
      <ul className={cn("grid gap-2", compact ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-4 lg:grid-cols-7")}>
        {days.map((d) => {
          const w = describeWeatherCode(d.weatherCode);
          const DIcon = ICONS[w.icon];
          return (
            <li key={d.date} className="flex flex-col items-center gap-1 rounded-xl bg-surface-muted p-2 text-center">
              <span className="text-xs font-semibold text-muted-foreground">{WEEKDAYS[weekday(d.date)]}</span>
              {!compact ? <span className="text-[0.7rem] text-subtle-foreground">{formatDate(d.date, { year: false })}</span> : null}
              <DIcon className="size-6 text-brand-600" aria-label={w.label} />
              <span className="text-sm font-bold">{t(d.tempMax)} <span className="font-normal text-muted-foreground">{t(d.tempMin)}</span></span>
              {d.precipitationProbability != null ? (
                <span className="text-[0.7rem] text-info">مطر {formatNumber(d.precipitationProbability, 0)}٪</span>
              ) : null}
            </li>
          );
        })}
      </ul>
      {shownAlerts.length ? (
        <ul className="flex flex-col gap-2">
          {shownAlerts.map((a, i) => (
            <li key={`${a.kind}-${a.date}-${i}`} className={cn("rounded-xl border p-3 text-sm", a.severity === "warning" ? "border-warning-border bg-warning-soft" : "border-info/20 bg-info-soft")}>
              <p className={cn("font-bold", a.severity === "warning" ? "text-warning" : "text-info")}>
                {a.title} — {formatDate(a.date, { weekday: true, year: false })}
              </p>
              <p className="leading-7 text-foreground/80">{a.message}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">لا توجد تنبيهات زراعية للطقس في الأيام القادمة.</p>
      )}
      <p className="text-xs text-subtle-foreground">
        المصدر: {forecast.source} · آخر تحديث: {formatDateTime(forecast.fetchedAt, timezone)}
      </p>
    </div>
  );
}

/** Full page panel. */
export function WeatherPanel() {
  const { state, reload, hasLocation, needsConsent, placeName, timezone } = useWeather();
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-6" aria-label="توقعات الطقس">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-extrabold">{placeName ? `الطقس في ${placeName}` : "الطقس"}</h2>
        {state.status === "ok" ? (
          <Button size="sm" variant="ghost" onClick={reload}><RefreshCw /> تحديث</Button>
        ) : null}
      </div>
      {needsConsent ? (
        <NeedsConsent />
      ) : !hasLocation ? (
        <NoLocation />
      ) : state.status === "error" ? (
        <ErrorBox message={state.message} onRetry={reload} />
      ) : state.status !== "ok" ? (
        <div role="status" aria-label="جارٍ تحميل الطقس" className="space-y-4">
          <Skeleton className="h-16 w-48" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {Array.from({ length: 7 }, (_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      ) : (
        <WeatherSummary data={state.data} timezone={timezone} />
      )}
    </section>
  );
}
