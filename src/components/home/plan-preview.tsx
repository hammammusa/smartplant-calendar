"use client";

import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MiniMonth } from "@/components/calendar/mini-month";
import { TaskTypeIcon } from "@/components/tasks/task-type-badge";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/form-controls";
import { CLIMATE_ZONE_LABELS } from "@/domain/labels";
import { generatePlan } from "@/domain/plan-generator";
import { CLIMATE_ZONES, type ClimateZone, type Crop, type ISODate, type TaskType } from "@/domain/types";
import { startOfMonth } from "@/lib/dates";
import { formatDate } from "@/lib/format";

/**
 * Interactive homepage preview: runs the real plan generator in the browser.
 * Nothing is saved — the section says so explicitly.
 */
export function PlanPreview({ crops, defaultDate }: { crops: Crop[]; defaultDate: ISODate }) {
  const [slug, setSlug] = useState(crops[0]?.slug ?? "");
  const [zone, setZone] = useState<ClimateZone>("highland");
  const [plantedOn, setPlantedOn] = useState(defaultDate);
  const [month, setMonth] = useState(startOfMonth(defaultDate));
  const [selected, setSelected] = useState<ISODate | null>(defaultDate);
  const crop = crops.find((c) => c.slug === slug) ?? crops[0];

  const plan = useMemo(
    () => (crop ? generatePlan({ crop, plantedOn, zone, spaceType: "home_garden" }) : null),
    [crop, plantedOn, zone],
  );

  const typesByDate = useMemo(() => {
    const map = new Map<ISODate, TaskType[]>();
    for (const t of plan?.tasks ?? []) map.set(t.dueDate, [...(map.get(t.dueDate) ?? []), t.type]);
    return map;
  }, [plan]);

  const dayTasks = plan?.tasks.filter((t) => t.dueDate === selected) ?? [];
  const nextTasks = plan?.tasks.filter((t) => t.type !== "irrigation" && t.dueDate >= (selected ?? plantedOn)).slice(0, 4) ?? [];
  if (!crop || !plan) return null;

  return (
    <div className="grid grid-cols-1 gap-6 rounded-2xl border border-border bg-surface p-4 shadow-md sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pv-crop">المحصول</Label>
            <Select id="pv-crop" value={slug} onChange={(e) => setSlug(e.target.value)}>
              {crops.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pv-zone">المنطقة المناخية</Label>
            <Select id="pv-zone" value={zone} onChange={(e) => setZone(e.target.value as ClimateZone)}>
              {CLIMATE_ZONES.map((z) => (
                <option key={z} value={z}>
                  {CLIMATE_ZONE_LABELS[z]}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pv-date">تاريخ الزراعة</Label>
            <input
              id="pv-date"
              type="date"
              value={plantedOn}
              onChange={(e) => {
                if (!e.target.value) return;
                setPlantedOn(e.target.value);
                setMonth(startOfMonth(e.target.value));
                setSelected(e.target.value);
              }}
              className="h-11 w-full rounded-lg border border-border-strong bg-surface px-3 text-sm"
            />
          </div>
        </div>
        <MiniMonth
          month={month}
          today={defaultDate}
          selected={selected}
          typesByDate={typesByDate}
          onSelect={setSelected}
          onMonthChange={setMonth}
          className="rounded-xl border border-border p-4"
        />
        <p className="flex items-start gap-2 text-xs leading-6 text-subtle-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          معاينة تفاعلية مبنية على بيانات أولية عامة، ولا يُحفظ منها شيء. أنشئ خطتك الخاصة لحفظ المهام وتعديلها.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{selected ? formatDate(selected, { weekday: true }) : "اختر يومًا"}</p>
          <h3 className="text-lg font-bold">{dayTasks.length ? `مهام هذا اليوم (${dayTasks.length})` : "لا توجد مهام في هذا اليوم"}</h3>
        </div>
        <ul className="flex flex-col gap-2">
          {dayTasks.map((t) => (
            <li key={t.templateKey} className="flex gap-3 rounded-xl border border-border p-3">
              <TaskTypeIcon type={t.type} />
              <div className="min-w-0">
                <p className="font-semibold">{t.title}</p>
                <p className="line-clamp-2 text-sm text-muted-foreground">{t.description}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="rounded-xl bg-surface-muted p-4">
          <p className="mb-2 text-sm font-bold">المحطات القادمة</p>
          <ul className="space-y-1.5 text-sm">
            {nextTasks.map((t) => (
              <li key={t.templateKey} className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  className="truncate text-start hover:text-brand-700"
                  onClick={() => {
                    setSelected(t.dueDate);
                    setMonth(startOfMonth(t.dueDate));
                  }}
                >
                  {t.title}
                </button>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(t.dueDate, { year: false })}</span>
              </li>
            ))}
          </ul>
        </div>
        {plan.warnings[0] && plan.windowFit !== "in_window" ? (
          <p className="rounded-lg border border-warning-border bg-warning-soft p-3 text-sm leading-7 text-warning">{plan.warnings[0]}</p>
        ) : null}
        <Button asChild className="mt-auto self-start">
          <Link href={`/planner?crop=${crop.slug}`}>
            أنشئ خطتي لـ{crop.name} <ArrowLeft />
          </Link>
        </Button>
      </div>
    </div>
  );
}
