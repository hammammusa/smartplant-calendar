"use client";

import {
  Check,
  Crosshair,
  List,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Mountain,
  Search,
  ShieldCheck,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAppData } from "@/components/providers/app-data-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, Spinner } from "@/components/ui/feedback";
import { Checkbox, Input, Label, Select } from "@/components/ui/form-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { COUNTRIES, findRegion, nearestRegion, regionsForCountry } from "@/data/regions";
import {
  accuracyLevel,
  distanceKm,
  formatAccuracy,
  formatCoordinate,
  isInLevant,
  suggestZone,
  type LatLon,
} from "@/domain/geo";
import { CLIMATE_ZONE_DESCRIPTIONS, CLIMATE_ZONE_LABELS } from "@/domain/labels";
import { LOCATION_SOURCE_LABELS, type LocationSource, type SavedLocation, type ZoneSource } from "@/domain/location";
import { CLIMATE_ZONES, type ClimateZone } from "@/domain/types";
import { formatNumber } from "@/lib/format";
import { fetchElevation } from "@/lib/geo/elevation";
import { GPS_ERROR_MESSAGES, GpsError, locateHighAccuracy, type GpsFix } from "@/lib/geo/gps";
import { reverseGeocode, searchPlaces, type Place } from "@/lib/geo/nominatim";
import { cn } from "@/lib/utils";

const MapPicker = dynamic(() => import("./map-picker").then((m) => m.MapPicker), {
  ssr: false,
  loading: () => <Skeleton className="h-80 w-full rounded-xl" />,
});

type Tab = "gps" | "map" | "search" | "list";

interface Draft extends LatLon {
  source: LocationSource;
  accuracyM: number | null;
  /** Name chosen from search/list; reverse geocoding fills it otherwise. */
  presetLabel: string | null;
}

const TABS: { id: Tab; label: string; icon: typeof MapPin }[] = [
  { id: "gps", label: "موقعي الحالي (GPS)", icon: LocateFixed },
  { id: "map", label: "الخريطة", icon: MapIcon },
  { id: "search", label: "بحث عن قرية أو مكان", icon: Search },
  { id: "list", label: "قائمة المدن", icon: List },
];

const ACCURACY_TEXT = {
  high: { tone: "success", text: "دقة عالية" },
  medium: { tone: "info", text: "دقة متوسطة" },
  low: { tone: "warning", text: "دقة ضعيفة" },
  very_low: { tone: "danger", text: "دقة ضعيفة جدًا" },
} as const;

/** Returns the async lookup result for `key`, or undefined while it is pending. */
function useKeyedResult<T>(key: string | null, run: (() => Promise<T>) | null): { value: T | undefined; done: boolean } {
  const [state, setState] = useState<{ key: string; value: T } | null>(null);
  const runRef = useRef(run);
  useEffect(() => {
    runRef.current = run;
  });
  useEffect(() => {
    if (!key || !runRef.current) return;
    let cancelled = false;
    const t = setTimeout(() => {
      runRef.current?.().then((value) => !cancelled && setState({ key, value }));
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [key]);
  const done = !!key && state?.key === key;
  return { value: done ? state!.value : undefined, done };
}

export function LocationPicker({ onConfirmed, className }: { onConfirmed?: (loc: SavedLocation) => void; className?: string }) {
  const { location, setLocation, mode } = useAppData();
  const [tab, setTab] = useState<Tab>("gps");
  const [consent, setConsent] = useState<boolean>(location?.externalConsent ?? false);
  const [draft, setDraft] = useState<Draft | null>(
    location
      ? { latitude: location.latitude, longitude: location.longitude, source: location.source, accuracyM: location.accuracyM, presetLabel: location.label }
      : null,
  );
  const [gpsState, setGpsState] = useState<{ status: "idle" | "locating" | "done" | "error"; fix?: GpsFix; message?: string }>({
    status: "idle",
  });
  const [query, setQuery] = useState("");
  const [searchState, setSearchState] = useState<{ status: "idle" | "loading" | "done" | "error"; results: Place[] }>({
    status: "idle",
    results: [],
  });
  const [country, setCountry] = useState(findRegion(location?.regionId)?.countryCode ?? "PS");
  const [manualZone, setManualZone] = useState<ClimateZone | null>(location?.zoneSource === "manual" ? location.zone : null);
  const [saving, setSaving] = useState(false);

  const nearest = draft ? nearestRegion(draft.latitude, draft.longitude) : null;
  const nearestKm = draft && nearest ? distanceKm(draft, nearest) : null;
  const pointKey = draft ? `${draft.latitude.toFixed(4)},${draft.longitude.toFixed(4)}` : null;

  // External lookups only with consent; the elevation request uses ~100 m rounding.
  const elevation = useKeyedResult(consent && draft ? `elev:${pointKey}` : null, draft ? () => fetchElevation(draft) : null);
  const place = useKeyedResult(
    consent && draft && !draft.presetLabel ? `rev:${pointKey}` : null,
    draft ? () => reverseGeocode(draft).catch(() => null) : null,
  );

  const elevationM = draft?.source === "gps" && gpsState.fix?.altitudeM != null && (gpsState.fix.altitudeAccuracyM ?? 999) <= 30
    ? gpsState.fix.altitudeM
    : (elevation.value ?? null);

  const suggestion = draft ? suggestZone(draft, elevationM, nearest ? { name: nearest.name, zone: nearest.zone } : null) : null;
  const zone: ClimateZone | null = manualZone ?? suggestion?.zone ?? null;
  const zoneSource: ZoneSource = manualZone ? "manual" : draft?.source === "list" ? "list" : (suggestion?.basis ?? "nearest_town");

  const label =
    draft?.presetLabel ??
    place.value?.label ??
    (draft ? `${formatCoordinate(draft.latitude, "lat")}، ${formatCoordinate(draft.longitude, "lon")}` : "");

  function pick(next: Draft) {
    setDraft(next);
    setManualZone(null);
  }

  async function runGps() {
    setGpsState({ status: "locating" });
    try {
      const fix = await locateHighAccuracy({
        maxWaitMs: 25_000,
        onProgress: (f) => setGpsState({ status: "locating", fix: f }),
      });
      setGpsState({ status: "done", fix });
      pick({ latitude: fix.latitude, longitude: fix.longitude, source: "gps", accuracyM: fix.accuracyM, presetLabel: null });
    } catch (e) {
      const kind = e instanceof GpsError ? e.kind : "unavailable";
      setGpsState({ status: "error", message: GPS_ERROR_MESSAGES[kind] });
    }
  }

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!consent || query.trim().length < 2) return;
    setSearchState({ status: "loading", results: [] });
    try {
      const results = await searchPlaces(query);
      setSearchState({ status: "done", results });
    } catch {
      setSearchState({ status: "error", results: [] });
    }
  }

  async function confirm() {
    if (!draft || !zone) return;
    const region = nearest!;
    const saved: SavedLocation = {
      version: 2,
      source: draft.source,
      latitude: draft.latitude,
      longitude: draft.longitude,
      accuracyM: draft.accuracyM,
      label,
      regionId: region.id,
      zone,
      zoneSource,
      elevationM: elevationM == null ? null : Math.round(elevationM),
      timezone: region.timezone,
      externalConsent: consent,
      confirmedAt: new Date().toISOString(),
    };
    setSaving(true);
    const res = await setLocation(saved);
    setSaving(false);
    if (!res.ok) {
      toast.error(`حُفظ الموقع على هذا الجهاز فقط: ${res.error}`);
    } else {
      toast.success(mode === "remote" ? "تم حفظ موقعك في حسابك" : "تم حفظ موقعك على هذا الجهاز");
    }
    onConfirmed?.(saved);
  }

  const gpsFix = gpsState.fix;
  const level = gpsFix ? accuracyLevel(gpsFix.accuracyM) : null;

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {/* Privacy consent */}
      <div className="rounded-xl border border-border bg-surface-muted p-4">
        <label className="flex items-start gap-3 text-sm leading-7">
          <Checkbox className="mt-1.5" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>
            <span className="flex items-center gap-1.5 font-bold"><ShieldCheck className="size-4 text-brand-600" aria-hidden /> أوافق على استخدام خدمات الخرائط والطقس الخارجية لموقعي</span>
            <span className="block text-muted-foreground">
              عند الموافقة نرسل الإحداثيات إلى OpenStreetMap (الخريطة، واسم المكان، والبحث) وإلى Open-Meteo (الارتفاع والطقس). نرسل إلى خدمة الطقس إحداثيات مقرّبة (نحو 1 كم) فقط، ولا نسجّل موقعك في أي أداة تحليلات. دون الموافقة يبقى تحديد GPS على جهازك فقط.
            </span>
          </span>
        </label>
      </div>

      <div role="tablist" aria-label="طريقة تحديد الموقع" className="grid grid-cols-2 gap-1 rounded-xl bg-surface-muted p-1 sm:grid-cols-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-semibold text-muted-foreground",
              tab === t.id && "bg-surface text-brand-700 shadow-xs",
            )}
          >
            <t.icon className="size-4" aria-hidden />
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" aria-label={TABS.find((t) => t.id === tab)?.label}>
        {tab === "gps" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              نطلب من جهازك أدق موقع متاح (GPS) وننتظر حتى 25 ثانية لتحسين الدقة. يُفضّل الوقوف في مكان مكشوف وتشغيل خدمة الموقع.
            </p>
            <Button className="self-start" onClick={runGps} disabled={gpsState.status === "locating"}>
              {gpsState.status === "locating" ? <Spinner /> : <Crosshair />}
              {gpsState.status === "locating" ? "جارٍ تحديد موقعك بدقة…" : "حدّد موقعي بدقة"}
            </Button>
            {gpsState.status === "locating" && gpsFix ? (
              <p role="status" className="text-sm text-muted-foreground">أفضل دقة حتى الآن: {formatAccuracy(gpsFix.accuracyM)}…</p>
            ) : null}
            {gpsState.status === "error" ? <Alert tone="warning" title="تعذّر تحديد الموقع">{gpsState.message}</Alert> : null}
            {gpsState.status === "done" && gpsFix && level ? (
              <div className="flex flex-col gap-2">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant={ACCURACY_TEXT[level].tone === "success" ? "default" : ACCURACY_TEXT[level].tone === "info" ? "info" : ACCURACY_TEXT[level].tone === "warning" ? "warning" : "danger"}>
                    {ACCURACY_TEXT[level].text}
                  </Badge>
                  <span>نصف قطر الدقة: <strong>{formatAccuracy(gpsFix.accuracyM)}</strong></span>
                </p>
                {level === "low" || level === "very_low" ? (
                  <Alert tone="warning" title="الدقة ضعيفة">
                    قد يكون الموقع بعيدًا عن أرضك بمئات الأمتار أو أكثر (غالبًا لأن الجهاز استخدم الشبكة بدل GPS). أعد المحاولة في مكان مكشوف، أو صحّح الموقع بسحب الدبوس على الخريطة.
                  </Alert>
                ) : null}
                <Button variant="outline" size="sm" className="self-start" onClick={() => setTab("map")}>
                  <MapIcon /> صحّح الموقع على الخريطة
                </Button>
              </div>
            ) : null}
          </div>
        )}

        {tab === "map" && (
          <div className="flex flex-col gap-3">
            {consent ? (
              <>
                <p className="text-sm text-muted-foreground">اضغط على الخريطة أو اسحب الدبوس إلى موقع أرضك بالضبط. يمكنك التكبير لرؤية الحقول والطرق.</p>
                <MapPicker
                  value={draft}
                  accuracyM={draft?.source === "gps" ? draft.accuracyM : null}
                  onChange={(p) => pick({ ...p, source: "map", accuracyM: null, presetLabel: null })}
                />
              </>
            ) : (
              <Alert tone="info" title="الخريطة تحتاج موافقتك">
                تُحمَّل صور الخريطة من خوادم OpenStreetMap، وهذا يكشف لها المنطقة المعروضة. فعّل خيار الموافقة أعلاه لعرض الخريطة، أو استخدم GPS أو قائمة المدن.
              </Alert>
            )}
          </div>
        )}

        {tab === "search" && (
          <div className="flex flex-col gap-3">
            {consent ? (
              <>
                <form onSubmit={runSearch} className="flex gap-2" role="search">
                  <Input
                    aria-label="اسم القرية أو البلدة أو المكان"
                    placeholder="مثال: بيت أمر، سبسطية، عرابة"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <Button type="submit" disabled={searchState.status === "loading" || query.trim().length < 2}>
                    {searchState.status === "loading" ? <Spinner /> : <Search />} بحث
                  </Button>
                </form>
                <p className="text-xs text-subtle-foreground">يتم البحث عند الضغط على «بحث» فقط، عبر خدمة Nominatim من OpenStreetMap.</p>
                {searchState.status === "error" ? <Alert tone="warning">تعذّر البحث الآن. تحقق من اتصالك أو حاول بعد قليل، أو اختر موقعك من الخريطة.</Alert> : null}
                {searchState.status === "done" && searchState.results.length === 0 ? (
                  <p className="text-sm text-muted-foreground">لا توجد نتائج. جرّب كتابة الاسم بطريقة أخرى أو أضف اسم المحافظة.</p>
                ) : null}
                <ul className="flex flex-col gap-2">
                  {searchState.results.map((r) => (
                    <li key={`${r.latitude},${r.longitude},${r.displayName}`}>
                      <button
                        type="button"
                        onClick={() => {
                          pick({ latitude: r.latitude, longitude: r.longitude, source: "search", accuracyM: null, presetLabel: r.label });
                          toast.success(`تم اختيار: ${r.label}. يمكنك ضبط الدبوس على الخريطة.`);
                        }}
                        className="w-full rounded-lg border border-border p-3 text-start hover:bg-surface-muted"
                      >
                        <span className="block font-semibold">{r.label}</span>
                        <span className="block truncate text-xs text-muted-foreground">{r.displayName}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {searchState.results.length ? <p className="text-xs text-subtle-foreground">بيانات الأماكن © مساهمو OpenStreetMap</p> : null}
              </>
            ) : (
              <Alert tone="info" title="البحث يحتاج موافقتك">يُرسل نص البحث إلى OpenStreetMap. فعّل خيار الموافقة أعلاه للبحث عن قريتك.</Alert>
            )}
          </div>
        )}

        {tab === "list" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              قائمة مختصرة بالمدن ومراكز المحافظات فقط. إن كانت أرضك في قرية أو منطقة ريفية فالأفضل استخدام GPS أو البحث أو الخريطة.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="loc-country">الدولة</Label>
                <Select id="loc-country" value={country} onChange={(e) => setCountry(e.target.value)}>
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="loc-city">المدينة</Label>
                <Select
                  id="loc-city"
                  value={draft?.source === "list" ? (nearest?.id ?? "") : ""}
                  onChange={(e) => {
                    const r = findRegion(e.target.value);
                    if (r) pick({ latitude: r.latitude, longitude: r.longitude, source: "list", accuracyM: null, presetLabel: r.name });
                  }}
                >
                  <option value="" disabled>اختر المدينة</option>
                  {regionsForCountry(country).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Result & confirmation */}
      {draft ? (
        <section aria-labelledby="loc-result" className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <h3 id="loc-result" className="flex items-center gap-2 font-bold"><MapPin className="size-5 text-brand-600" aria-hidden /> الموقع المحدد</h3>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold text-subtle-foreground">المكان</dt>
              <dd className="font-semibold" data-testid="location-label">
                {consent && !draft.presetLabel && !place.done ? <span className="text-muted-foreground">جارٍ معرفة اسم المكان…</span> : label}
              </dd>
              {!consent && !draft.presetLabel ? <dd className="text-xs text-subtle-foreground">وافق على الخدمات الخارجية لمعرفة اسم القرية أو الحي.</dd> : null}
            </div>
            <div>
              <dt className="text-xs font-semibold text-subtle-foreground">الإحداثيات</dt>
              <dd dir="ltr" className="text-end font-mono text-xs" data-testid="location-coords">
                {draft.latitude.toFixed(5)}, {draft.longitude.toFixed(5)}
              </dd>
              {draft.accuracyM != null ? <dd className="text-xs">الدقة: {formatAccuracy(draft.accuracyM)}</dd> : null}
              <dd className="text-xs text-subtle-foreground">المصدر: {LOCATION_SOURCE_LABELS[draft.source]}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-subtle-foreground">الارتفاع</dt>
              <dd>
                {elevationM != null
                  ? `${formatNumber(Math.round(elevationM), 0)} م ${elevationM < 0 ? "(تحت سطح البحر)" : "فوق سطح البحر"}`
                  : consent && !elevation.done
                    ? "جارٍ الحساب…"
                    : "غير متوفر"}
              </dd>
              {elevationM != null ? <dd className="text-xs text-subtle-foreground">من نموذج تضاريس Copernicus عبر Open-Meteo (دقة نحو 90 م)</dd> : null}
            </div>
            <div>
              <dt className="text-xs font-semibold text-subtle-foreground">أقرب مدينة في قائمتنا (للمرجع فقط)</dt>
              <dd>{nearest ? `${nearest.name} — على بعد نحو ${formatNumber(Math.round(nearestKm ?? 0), 0)} كم` : "—"}</dd>
            </div>
          </dl>

          {!isInLevant(draft) ? (
            <Alert tone="warning">هذا الموقع خارج بلاد الشام. مواعيد الزراعة في المنصة مصممة لفلسطين والمنطقة، فقد لا تناسب موقعك.</Alert>
          ) : null}

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 flex items-center gap-1.5 text-sm font-bold"><Mountain className="size-4 text-brand-600" aria-hidden /> المنطقة المناخية</legend>
            {suggestion ? (
              <p className="text-sm leading-7 text-muted-foreground">
                المقترح: <strong className="text-foreground">{CLIMATE_ZONE_LABELS[suggestion.zone]}</strong> — {suggestion.reason}
              </p>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-2">
              {CLIMATE_ZONES.map((z) => (
                <label
                  key={z}
                  className={cn("flex cursor-pointer gap-3 rounded-xl border p-3", zone === z ? "border-primary bg-accent/50" : "border-border hover:bg-surface-muted")}
                >
                  <input
                    type="radio"
                    name="loc-zone"
                    value={z}
                    checked={zone === z}
                    onChange={() => setManualZone(z === suggestion?.zone ? null : z)}
                    className="mt-1.5 accent-[var(--primary)]"
                  />
                  <span>
                    <span className="block font-semibold">
                      {CLIMATE_ZONE_LABELS[z]}
                      {suggestion?.zone === z ? <Badge className="ms-2">مقترح</Badge> : null}
                    </span>
                    <span className="block text-xs leading-6 text-muted-foreground">{CLIMATE_ZONE_DESCRIPTIONS[z]}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-2">
            <Button onClick={confirm} disabled={!zone || saving}>
              {saving ? <Spinner /> : <Check />} تأكيد الموقع وحفظه
            </Button>
            {location ? (
              <Button
                variant="danger-ghost"
                onClick={async () => {
                  await setLocation(null);
                  setDraft(null);
                  toast.success("تم حذف الموقع المحفوظ");
                }}
              >
                <Trash2 /> حذف الموقع المحفوظ
              </Button>
            ) : null}
          </div>
          <p className="flex items-start gap-2 text-xs leading-6 text-subtle-foreground">
            <TriangleAlert className="mt-1 size-3.5 shrink-0" aria-hidden />
            اقتراح المنطقة المناخية قاعدة تقريبية (الارتفاع والقرب من البحر). صحّحها يدويًا إن كانت ظروف أرضك مختلفة.
          </p>
        </section>
      ) : null}
    </div>
  );
}
