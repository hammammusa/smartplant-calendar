"use client";

/**
 * High-accuracy browser geolocation. Watches the position for up to
 * `maxWaitMs`, keeps the most accurate fix and stops early once it is good
 * enough. Coordinates never leave the device here.
 */
import { GOOD_ENOUGH_ACCURACY_M } from "@/domain/geo";

export interface GpsFix {
  latitude: number;
  longitude: number;
  accuracyM: number;
  altitudeM: number | null;
  altitudeAccuracyM: number | null;
  timestamp: number;
}

export type GpsErrorKind = "unsupported" | "insecure" | "denied" | "unavailable" | "timeout";

export class GpsError extends Error {
  constructor(public kind: GpsErrorKind) {
    super(kind);
  }
}

export const GPS_ERROR_MESSAGES: Record<GpsErrorKind, string> = {
  unsupported: "متصفحك لا يدعم تحديد الموقع. اختر موقعك من الخريطة أو بالبحث.",
  insecure: "تحديد الموقع يتطلب اتصالًا آمنًا (https). افتح الموقع عبر رابط آمن أو اختر موقعك من الخريطة.",
  denied:
    "رُفض إذن الوصول إلى الموقع. يمكنك السماح به من إعدادات المتصفح (رمز القفل بجانب الرابط) ثم المحاولة مجددًا، أو اختيار موقعك يدويًا من الخريطة.",
  unavailable: "تعذّر تحديد موقعك الآن. تأكد من تشغيل خدمة الموقع (GPS) في جهازك وجرّب في مكان مكشوف، أو اختر موقعك من الخريطة.",
  timeout: "استغرق تحديد الموقع وقتًا أطول من المتوقع دون نتيجة. حاول مرة أخرى في مكان مكشوف أو اختر موقعك من الخريطة.",
};

export function locateHighAccuracy(
  opts: { maxWaitMs?: number; onProgress?: (fix: GpsFix) => void; signal?: AbortSignal } = {},
): Promise<GpsFix> {
  const maxWaitMs = opts.maxWaitMs ?? 20_000;
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.isSecureContext === false) return reject(new GpsError("insecure"));
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return reject(new GpsError("unsupported"));

    let best: GpsFix | null = null;
    let settled = false;
    let watchId: number | null = null;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      clearTimeout(timer);
      fn();
    };

    const timer = setTimeout(() => {
      finish(() => (best ? resolve(best) : reject(new GpsError("timeout"))));
    }, maxWaitMs);

    opts.signal?.addEventListener("abort", () => finish(() => reject(new GpsError("timeout"))));

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const fix: GpsFix = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyM: pos.coords.accuracy,
          altitudeM: pos.coords.altitude,
          altitudeAccuracyM: pos.coords.altitudeAccuracy,
          timestamp: pos.timestamp,
        };
        if (!best || fix.accuracyM < best.accuracyM) {
          best = fix;
          opts.onProgress?.(fix);
        }
        if (fix.accuracyM <= GOOD_ENOUGH_ACCURACY_M) finish(() => resolve(fix));
      },
      (err) => {
        const kind: GpsErrorKind = err.code === 1 ? "denied" : err.code === 3 ? "timeout" : "unavailable";
        // A timeout after at least one fix is not fatal: keep the best fix.
        if (best && kind !== "denied") return finish(() => resolve(best!));
        finish(() => reject(new GpsError(kind)));
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: maxWaitMs },
    );
  });
}
