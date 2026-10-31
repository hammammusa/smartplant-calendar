"use client";

import { LocateFixed, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form-controls";
import { COUNTRIES, findRegion, nearestRegion, REGIONS } from "@/data/regions";
import { Spinner } from "@/components/ui/feedback";

/** Lets guests (and users) choose the city used for weather. */
export function WeatherLocationPicker() {
  const { location, setLocation, mode } = useAppData();
  const [busy, setBusy] = useState(false);
  const region = findRegion(location?.regionId);

  const choose = (id: string) => {
    const r = findRegion(id);
    if (!r) return;
    setLocation({ regionId: r.id, zone: r.zone, latitude: r.latitude, longitude: r.longitude, timezone: r.timezone });
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center">
      <MapPin className="hidden size-5 text-brand-600 sm:block" aria-hidden />
      <label htmlFor="wx-city" className="text-sm font-semibold">المدينة</label>
      <div className="sm:w-64">
        <Select id="wx-city" value={region?.id ?? ""} onChange={(e) => choose(e.target.value)}>
          <option value="" disabled>اختر مدينتك</option>
          {COUNTRIES.map((c) => (
            <optgroup key={c.code} label={c.name}>
              {REGIONS.filter((r) => r.countryCode === c.code).map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </optgroup>
          ))}
        </Select>
      </div>
      <Button
        variant="outline"
        disabled={busy}
        onClick={() => {
          if (!("geolocation" in navigator)) return toast.error("متصفحك لا يدعم تحديد الموقع.");
          setBusy(true);
          navigator.geolocation.getCurrentPosition(
            (p) => {
              const r = nearestRegion(p.coords.latitude, p.coords.longitude);
              setLocation({
                regionId: r.id,
                zone: r.zone,
                latitude: Number(p.coords.latitude.toFixed(4)),
                longitude: Number(p.coords.longitude.toFixed(4)),
                timezone: r.timezone,
              });
              setBusy(false);
            },
            () => {
              setBusy(false);
              toast.error("تعذّر تحديد موقعك. اسمح للمتصفح بالوصول إلى الموقع أو اختر مدينتك.");
            },
            { timeout: 10000 },
          );
        }}
      >
        {busy ? <Spinner /> : <LocateFixed />} موقعي الحالي
      </Button>
      {mode === "remote" ? (
        <p className="text-xs text-subtle-foreground sm:ms-auto">لحفظ موقعك في حسابك استخدم صفحة الملف الشخصي.</p>
      ) : null}
    </div>
  );
}
