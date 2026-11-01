"use client";

import { MapPin, MapPinOff, Pencil } from "lucide-react";
import Link from "next/link";
import { useAppData } from "@/components/providers/app-data-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAccuracy } from "@/domain/geo";
import { CLIMATE_ZONE_LABELS } from "@/domain/labels";
import { LOCATION_SOURCE_LABELS, ZONE_SOURCE_LABELS } from "@/domain/location";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Compact card showing the confirmed location, with a link to change it. */
export function LocationSummary({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { location, mode } = useAppData();
  if (mode === "loading") return <Skeleton className={cn("h-20 w-full rounded-2xl", className)} />;
  if (!location) {
    return (
      <div className={cn("flex flex-col gap-3 rounded-2xl border border-dashed border-border-strong bg-surface p-4 sm:flex-row sm:items-center", className)}>
        <MapPinOff className="size-6 shrink-0 text-subtle-foreground" aria-hidden />
        <p className="flex-1 text-sm text-muted-foreground">لم تحدد موقع أرضك بعد. حدّده لنقترح ما يناسب منطقتك وطقسها.</p>
        <Button asChild size="sm"><Link href="/location">حدّد موقعي</Link></Button>
      </div>
    );
  }
  return (
    <div className={cn("flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center", className)}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <MapPin className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold" data-testid="saved-location-label">{location.label}</p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <Badge>{CLIMATE_ZONE_LABELS[location.zone]}</Badge>
          {compact ? null : <span>{ZONE_SOURCE_LABELS[location.zoneSource]}</span>}
          {location.elevationM != null ? <span>الارتفاع {formatNumber(location.elevationM, 0)} م</span> : null}
          {location.accuracyM != null ? <span>الدقة {formatAccuracy(location.accuracyM)}</span> : null}
          {compact ? null : <span>{LOCATION_SOURCE_LABELS[location.source]}</span>}
        </p>
      </div>
      <Button asChild size="sm" variant="outline"><Link href="/location"><Pencil /> تغيير الموقع</Link></Button>
    </div>
  );
}
