"use client";

import { Search, SearchX, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useDeferredValue, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Input, Label, Select } from "@/components/ui/form-controls";
import { filterCrops, type CropFilters } from "@/domain/crop-filter";
import { CATEGORY_LABELS, CLIMATE_ZONE_LABELS, DIFFICULTY_LABELS, SEASON_LABELS, SPACE_TYPE_LABELS } from "@/domain/labels";
import { CLIMATE_ZONES, CROP_CATEGORIES, DIFFICULTIES, SEASONS, SPACE_TYPES, type Crop } from "@/domain/types";
import { formatNumber } from "@/lib/format";
import { CropCard } from "./crop-card";

const EMPTY: CropFilters = { query: "", season: "", category: "", space: "", difficulty: "", zone: "" };

/**
 * Reads `?q=` (e.g. from the home page search). Render it inside <Suspense>
 * with a plain <CropBrowser> as the fallback, so the static HTML still lists
 * every crop.
 */
export function CropBrowserFromQuery({ crops }: { crops: Crop[] }) {
  const q = (useSearchParams().get("q") ?? "").slice(0, 60);
  return <CropBrowser key={q} crops={crops} initialQuery={q} />;
}

export function CropBrowser({ crops, initialQuery = "" }: { crops: Crop[]; initialQuery?: string }) {
  const [filters, setFilters] = useState<CropFilters>(() => ({ ...EMPTY, query: initialQuery }));
  const [showFilters, setShowFilters] = useState(false);
  const deferred = useDeferredValue(filters);
  const results = useMemo(() => filterCrops(crops, deferred), [crops, deferred]);
  const active = Object.entries(filters).filter(([k, v]) => k !== "query" && v).length;
  const set = (patch: Partial<CropFilters>) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs sm:p-5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-3.5 top-1/2 size-5 -translate-y-1/2 text-subtle-foreground" aria-hidden />
            <Input
              type="search"
              aria-label="ابحث عن محصول"
              placeholder="ابحث عن محصول، مثل: بندورة أو زعتر"
              value={filters.query}
              onChange={(e) => set({ query: e.target.value })}
              className="ps-11"
            />
          </div>
          <Button
            variant="outline"
            className="md:hidden"
            aria-expanded={showFilters}
            aria-controls="crop-filters"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal /> الفلاتر{active ? ` (${formatNumber(active)})` : ""}
          </Button>
        </div>
        <div id="crop-filters" className={`mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 ${showFilters ? "" : "hidden md:grid"}`}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="f-season">الموسم</Label>
            <Select id="f-season" value={filters.season} onChange={(e) => set({ season: e.target.value as CropFilters["season"] })}>
              <option value="">كل المواسم</option>
              {SEASONS.map((s) => (
                <option key={s} value={s}>{SEASON_LABELS[s]}</option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="f-zone">المنطقة المناخية</Label>
            <Select id="f-zone" value={filters.zone} onChange={(e) => set({ zone: e.target.value as CropFilters["zone"] })}>
              <option value="">كل المناطق</option>
              {CLIMATE_ZONES.map((z) => (
                <option key={z} value={z}>{CLIMATE_ZONE_LABELS[z]}</option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="f-category">التصنيف</Label>
            <Select id="f-category" value={filters.category} onChange={(e) => set({ category: e.target.value as CropFilters["category"] })}>
              <option value="">كل التصنيفات</option>
              {CROP_CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="f-space">نوع المساحة</Label>
            <Select id="f-space" value={filters.space} onChange={(e) => set({ space: e.target.value as CropFilters["space"] })}>
              <option value="">كل المساحات</option>
              {SPACE_TYPES.map((s) => (
                <option key={s} value={s}>{SPACE_TYPE_LABELS[s]}</option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="f-difficulty">مستوى الصعوبة</Label>
            <Select id="f-difficulty" value={filters.difficulty} onChange={(e) => set({ difficulty: e.target.value as CropFilters["difficulty"] })}>
              <option value="">كل المستويات</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {results.length === crops.length ? `${formatNumber(crops.length)} محصولًا في الدليل` : `${formatNumber(results.length)} من ${formatNumber(crops.length)} محصولًا`}
        </p>
        {active || filters.query ? (
          <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY)}>
            <X /> مسح البحث والفلاتر
          </Button>
        ) : null}
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="لا توجد محاصيل مطابقة"
          description="جرّب كلمة بحث أخرى أو خفّف الفلاتر. إذا كان المحصول غير موجود في الدليل فقد نضيفه قريبًا."
          action={<Button variant="outline" onClick={() => setFilters(EMPTY)}>عرض كل المحاصيل</Button>}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((crop) => (
            <CropCard key={crop.slug} crop={crop} />
          ))}
        </div>
      )}
    </div>
  );
}
