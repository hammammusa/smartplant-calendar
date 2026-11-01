"use client";

import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { LatLon } from "@/domain/geo";
import { cn } from "@/lib/utils";

/** Default view: historic Palestine and surroundings. */
export const DEFAULT_CENTER: LatLon = { latitude: 31.9, longitude: 35.1 };

const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="32" height="44" aria-hidden="true"><path d="M16 1C7.7 1 1 7.6 1 15.8 1 27 16 43 16 43s15-16 15-27.2C31 7.6 24.3 1 16 1Z" fill="#166534" stroke="#fff" stroke-width="2"/><circle cx="16" cy="16" r="6" fill="#a3e635"/></svg>`;

/**
 * Interactive OpenStreetMap map with a draggable pin. Leaflet is loaded on the
 * client only. Tiles come from tile.openstreetmap.org (light, personal use is
 * within the OSM tile policy) and the Arabic attribution links to the licence.
 * The parent only renders this after the user consents to external services.
 */
export function MapPicker({
  value,
  accuracyM,
  onChange,
  className,
}: {
  value: LatLon | null;
  accuracyM?: number | null;
  onChange: (p: LatLon) => void;
  className?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const markerRef = useRef<Leaflet.Marker | null>(null);
  const circleRef = useRef<Leaflet.Circle | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current || mapRef.current) return;
      leafletRef.current = L;
      const start = value ?? DEFAULT_CENTER;
      const map = L.map(el.current, { zoomControl: true, attributionControl: true }).setView(
        [start.latitude, start.longitude],
        value ? 15 : 8,
      );
      map.attributionControl.setPrefix(false);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© مساهمو OpenStreetMap</a>',
      }).addTo(map);
      const icon = L.divIcon({ html: PIN_SVG, className: "smartplant-pin", iconSize: [32, 44], iconAnchor: [16, 43] });
      const marker = L.marker([start.latitude, start.longitude], {
        draggable: true,
        icon,
        keyboard: true,
        title: "اسحب الدبوس إلى موقع أرضك",
        alt: "دبوس موقع الأرض",
      }).addTo(map);
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        onChangeRef.current({ latitude: p.lat, longitude: p.lng });
      });
      map.on("click", (e: Leaflet.LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        onChangeRef.current({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      });
      mapRef.current = map;
      markerRef.current = marker;
      // The container may have been laid out after creation (dialogs, tabs).
      setTimeout(() => map.invalidateSize(), 50);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
    // The map is created once; later position changes are applied below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow external changes (GPS fix, search result).
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    const L = leafletRef.current;
    if (!map || !marker || !L || !value) return;
    const cur = marker.getLatLng();
    if (Math.abs(cur.lat - value.latitude) > 1e-7 || Math.abs(cur.lng - value.longitude) > 1e-7) {
      marker.setLatLng([value.latitude, value.longitude]);
      map.setView([value.latitude, value.longitude], Math.max(map.getZoom(), 15));
    }
    circleRef.current?.remove();
    circleRef.current = null;
    if (accuracyM && accuracyM > 0 && accuracyM < 50_000) {
      circleRef.current = L.circle([value.latitude, value.longitude], {
        radius: accuracyM,
        color: "#65a30d",
        weight: 1,
        fillOpacity: 0.12,
      }).addTo(map);
    }
  }, [value, accuracyM]);

  return (
    <div
      ref={el}
      dir="ltr"
      role="application"
      aria-label="خريطة تفاعلية: اضغط أو اسحب الدبوس لتحديد موقع أرضك"
      className={cn("z-0 h-80 w-full overflow-hidden rounded-xl border border-border bg-surface-muted", className)}
    />
  );
}
