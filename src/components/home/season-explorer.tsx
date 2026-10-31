"use client";

import { CloudRain, Flower2, Leaf, Sun } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CropArt } from "@/components/brand/crop-art";
import { Label, Select } from "@/components/ui/form-controls";
import { CLIMATE_ZONE_DESCRIPTIONS, CLIMATE_ZONE_LABELS, METHOD_LABELS, SEASON_LABELS, SEASON_MONTHS } from "@/domain/labels";
import { monthInWindow } from "@/domain/planting-windows";
import { CLIMATE_ZONES, SEASONS, type ClimateZone, type Crop, type Season } from "@/domain/types";
import { formatMonthRange } from "@/lib/format";
import { cn } from "@/lib/utils";

const SEASON_ICON = { winter: CloudRain, spring: Flower2, summer: Sun, autumn: Leaf } as const;

export function SeasonExplorer({ crops, initialSeason }: { crops: Crop[]; initialSeason: Season }) {
  const [season, setSeason] = useState<Season>(initialSeason);
  const [zone, setZone] = useState<ClimateZone>("highland");
  const months = SEASON_MONTHS[season];

  const rows = crops
    .map((crop) => ({
      crop,
      windows: crop.windows.filter(
        (w) => w.zone === zone && months.some((m) => monthInWindow(m, w.startMonth, w.endMonth)),
      ),
    }))
    .filter((r) => r.windows.length > 0);

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs sm:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div role="tablist" aria-label="الفصول" className="flex gap-1 overflow-x-auto rounded-xl bg-surface-muted p-1 scrollbar-none">
          {SEASONS.map((s) => {
            const Icon = SEASON_ICON[s];
            return (
              <button
                key={s}
                role="tab"
                type="button"
                aria-selected={season === s}
                onClick={() => setSeason(s)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors",
                  season === s && "bg-surface text-brand-700 shadow-xs",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {SEASON_LABELS[s]}
              </button>
            );
          })}
        </div>
        <div className="flex min-w-60 flex-col gap-1.5">
          <Label htmlFor="season-zone">المنطقة المناخية</Label>
          <Select id="season-zone" value={zone} onChange={(e) => setZone(e.target.value as ClimateZone)}>
            {CLIMATE_ZONES.map((z) => (
              <option key={z} value={z}>
                {CLIMATE_ZONE_LABELS[z]}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{CLIMATE_ZONE_DESCRIPTIONS[zone]}</p>

      <div role="tabpanel" className="mt-5">
        {rows.length === 0 ? (
          <p className="rounded-xl bg-surface-muted p-6 text-center text-sm text-muted-foreground">
            لا توجد في دليلنا الحالي محاصيل بمواعيد زراعة مقترحة في {SEASON_LABELS[season]} لهذه المنطقة.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map(({ crop, windows }) => (
              <li key={crop.slug}>
                <Link
                  href={`/crops/${crop.slug}`}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:border-border-strong hover:bg-surface-muted"
                >
                  <span className="size-14 shrink-0 overflow-hidden rounded-lg">
                    <CropArt slug={crop.slug} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold">{crop.name}</span>
                    {windows.map((w, i) => (
                      <span key={i} className="block text-xs text-muted-foreground">
                        {METHOD_LABELS[w.method]}: {formatMonthRange(w.startMonth, w.endMonth)}
                        {w.note ? ` — ${w.note}` : ""}
                      </span>
                    ))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-4 text-xs text-subtle-foreground">المواعيد تقديرات أولية عامة، وقد تختلف حسب الارتفاع والصنف وظروف كل موسم.</p>
    </div>
  );
}
