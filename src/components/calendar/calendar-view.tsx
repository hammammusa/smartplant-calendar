"use client";

import { CalendarDays, ChevronLeft, ChevronRight, Filter, List, Plus, Rows3, Sprout } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useAppData } from "@/components/providers/app-data-provider";
import { AddTaskDialog, TaskDialog } from "@/components/tasks/task-dialogs";
import { TaskRow } from "@/components/tasks/task-row";
import { TASK_TYPE_STYLE } from "@/components/tasks/task-type-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Label, Select } from "@/components/ui/form-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { TASK_TYPE_LABELS } from "@/domain/labels";
import { filterTasks, groupByDate, sortTasks, type TaskFilters } from "@/domain/tasks";
import { TASK_TYPES, type ISODate, type Task } from "@/domain/types";
import {
  addDays,
  addMonths,
  endOfMonth,
  isSameMonth,
  isValidISODate,
  monthGrid,
  parseISODate,
  startOfMonth,
  toISODate,
  weekDays,
  weekday,
} from "@/lib/dates";
import { formatDate, formatMonthYear, formatNumber, formatShortDate, LEVANT_MONTHS, WEEKDAYS, WEEKDAYS_SHORT } from "@/lib/format";
import { cn } from "@/lib/utils";
import { WEEKDAY_ORDER } from "./mini-month";

type View = "month" | "week" | "list";

const VIEWS: { id: View; label: string; icon: typeof CalendarDays }[] = [
  { id: "month", label: "شهري", icon: CalendarDays },
  { id: "week", label: "أسبوعي", icon: Rows3 },
  { id: "list", label: "قائمة", icon: List },
];

export function CalendarView() {
  const params = useSearchParams();
  const { data, today, mode, error } = useAppData();
  const initial = params.get("date");
  const [cursor, setCursor] = useState<ISODate>(initial && isValidISODate(initial) ? initial : today);
  const [selected, setSelected] = useState<ISODate>(initial && isValidISODate(initial) ? initial : today);
  const [view, setView] = useState<View>("month");
  const [filters, setFilters] = useState<TaskFilters>({ plantingId: "", gardenId: "", type: "", status: "" });
  const [openTask, setOpenTask] = useState<Task | null>(null);
  const [adding, setAdding] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => filterTasks(data.tasks, filters, today), [data.tasks, filters, today]);
  const byDate = useMemo(() => groupByDate(sortTasks(filtered)), [filtered]);
  const activeFilters = Object.values(filters).filter(Boolean).length;

  const step = (dir: 1 | -1) => {
    const next = view === "week" ? addDays(cursor, 7 * dir) : addMonths(cursor, dir);
    setCursor(next);
    setSelected(view === "week" ? addDays(selected, 7 * dir) : isSameMonth(today, next) ? today : startOfMonth(next));
  };
  const goToday = () => {
    setCursor(today);
    setSelected(today);
  };

  const title =
    view === "week"
      ? (() => {
          const days = weekDays(cursor);
          return `${formatShortDate(days[0])} – ${formatShortDate(days[6])} ${parseISODate(days[6]).year}`;
        })()
      : formatMonthYear(cursor, true);

  const { year: cy, month: cm } = parseISODate(cursor);
  const years = Array.from({ length: 7 }, (_, i) => parseISODate(today).year - 2 + i);

  if (mode === "loading") {
    return (
      <div role="status" aria-label="جارٍ تحميل الرزنامة" className="grid gap-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-[30rem] w-full rounded-2xl" />
      </div>
    );
  }

  const selectedTasks = byDate.get(selected) ?? [];
  const listTasks = sortTasks(filtered.filter((t) => t.dueDate >= startOfMonth(cursor) && t.dueDate <= endOfMonth(cursor)));

  return (
    <div className="flex flex-col gap-4">
      {error ? <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p> : null}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-3 shadow-xs sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => step(-1)} aria-label={view === "week" ? "الأسبوع السابق" : "الشهر السابق"}>
              <ChevronRight />
            </Button>
            <Button variant="outline" size="icon" onClick={() => step(1)} aria-label={view === "week" ? "الأسبوع التالي" : "الشهر التالي"}>
              <ChevronLeft />
            </Button>
          </div>
          <h2 className="min-w-0 flex-1 truncate text-lg font-extrabold sm:text-xl" aria-live="polite">{title}</h2>
          <Button variant="ghost" size="sm" onClick={goToday}>اليوم</Button>
          <div role="tablist" aria-label="طريقة العرض" className="flex rounded-lg bg-surface-muted p-1">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={view === v.id}
                onClick={() => setView(v.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-semibold text-muted-foreground",
                  view === v.id && "bg-surface text-brand-700 shadow-xs",
                )}
              >
                <v.icon className="size-4" aria-hidden />
                <span className="hidden sm:inline">{v.label}</span>
                <span className="sr-only sm:hidden">{v.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex gap-2">
            <label className="sr-only" htmlFor="jump-month">الشهر</label>
            <Select
              id="jump-month"
              className="h-9 w-36 text-sm"
              value={cm}
              onChange={(e) => {
                const d = toISODate(cy, Number(e.target.value), 1);
                setCursor(d);
                setSelected(d);
              }}
            >
              {LEVANT_MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </Select>
            <label className="sr-only" htmlFor="jump-year">السنة</label>
            <Select
              id="jump-year"
              className="h-9 w-24 text-sm"
              value={cy}
              onChange={(e) => {
                const d = toISODate(Number(e.target.value), cm, 1);
                setCursor(d);
                setSelected(d);
              }}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </Select>
          </div>
          <Button variant="outline" size="sm" className="ms-auto" aria-expanded={showFilters} onClick={() => setShowFilters((v) => !v)}>
            <Filter /> الفلاتر{activeFilters ? ` (${formatNumber(activeFilters)})` : ""}
          </Button>
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus /> مهمة جديدة
          </Button>
        </div>
        {showFilters ? (
          <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cf-crop">المحصول</Label>
              <Select id="cf-crop" value={filters.plantingId} onChange={(e) => setFilters((f) => ({ ...f, plantingId: e.target.value }))}>
                <option value="">كل المحاصيل</option>
                {data.plantings.map((p) => (
                  <option key={p.id} value={p.id}>{p.cropName} ({formatShortDate(p.plantedOn)})</option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cf-garden">المساحة</Label>
              <Select id="cf-garden" value={filters.gardenId} onChange={(e) => setFilters((f) => ({ ...f, gardenId: e.target.value }))}>
                <option value="">كل المساحات</option>
                {data.gardens.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cf-type">نوع المهمة</Label>
              <Select id="cf-type" value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as TaskFilters["type"] }))}>
                <option value="">كل الأنواع</option>
                {TASK_TYPES.map((t) => (
                  <option key={t} value={t}>{TASK_TYPE_LABELS[t]}</option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cf-status">الحالة</Label>
              <Select id="cf-status" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as TaskFilters["status"] }))}>
                <option value="">كل الحالات</option>
                <option value="pending">قيد الانتظار</option>
                <option value="overdue">متأخرة</option>
                <option value="done">مكتملة</option>
              </Select>
            </div>
          </div>
        ) : null}
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="دليل الألوان">
          {TASK_TYPES.map((t) => (
            <li key={t} className="flex items-center gap-1.5">
              <span className={cn("size-2.5 rounded-full", TASK_TYPE_STYLE[t].dot)} aria-hidden />
              {TASK_TYPE_LABELS[t]}
            </li>
          ))}
        </ul>
      </div>

      {data.tasks.length === 0 ? (
        <EmptyState
          icon={Sprout}
          title="رزنامتك فارغة حتى الآن"
          description="أنشئ خطة زراعية لتظهر مهام الزراعة والري والتسميد والحصاد هنا، أو أضف مهمة خاصة."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild><Link href="/planner">أنشئ خطة زراعية</Link></Button>
              <Button variant="outline" onClick={() => setAdding(true)}><Plus /> مهمة خاصة</Button>
            </div>
          }
        />
      ) : view === "list" ? (
        <section aria-label={`مهام ${formatMonthYear(cursor)}`} className="flex flex-col gap-4">
          {listTasks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border-strong p-8 text-center text-sm text-muted-foreground">لا توجد مهام مطابقة في هذا الشهر.</p>
          ) : (
            [...groupByDate(listTasks).entries()].map(([date, tasks]) => (
              <div key={date}>
                <h3 className={cn("mb-2 text-sm font-bold", date === today && "text-brand-700")}>
                  {formatDate(date, { weekday: true })} {date === today ? "· اليوم" : ""}
                </h3>
                <ul className="flex flex-col gap-2">
                  {tasks.map((t) => (
                    <TaskRow key={t.id} task={t} onOpen={setOpenTask} showDate={false} />
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          {view === "month" ? (
            <MonthGrid cursor={cursor} today={today} selected={selected} byDate={byDate} onSelect={setSelected} onOpen={setOpenTask} />
          ) : (
            <WeekGrid cursor={cursor} today={today} selected={selected} byDate={byDate} onSelect={setSelected} onOpen={setOpenTask} />
          )}
          <section aria-labelledby="day-title" className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 id="day-title" className="font-bold">{formatDate(selected, { weekday: true })}</h3>
                <p className="text-xs text-muted-foreground">{selectedTasks.length ? `${formatNumber(selectedTasks.length)} مهام` : "لا توجد مهام"}</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setAdding(true)} aria-label="إضافة مهمة في هذا اليوم">
                <Plus /> إضافة
              </Button>
            </div>
            <ul className="flex flex-col gap-2">
              {selectedTasks.map((t) => (
                <TaskRow key={t.id} task={t} onOpen={setOpenTask} showDate={false} />
              ))}
            </ul>
          </section>
        </div>
      )}

      <TaskDialog task={openTask} onClose={() => setOpenTask(null)} />
      <AddTaskDialog open={adding} onOpenChange={setAdding} date={selected} />
    </div>
  );
}

interface GridProps {
  cursor: ISODate;
  today: ISODate;
  selected: ISODate;
  byDate: Map<ISODate, Task[]>;
  onSelect: (d: ISODate) => void;
  onOpen: (t: Task) => void;
}

function Chip({ task, onOpen }: { task: Task; onOpen: (t: Task) => void }) {
  const s = TASK_TYPE_STYLE[task.type];
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen(task);
      }}
      className={cn(
        "block w-full truncate rounded-md px-1.5 py-0.5 text-start text-[0.7rem] font-semibold leading-5",
        s.bg,
        s.text,
        task.status === "done" && "line-through opacity-60",
      )}
      title={task.title}
    >
      {task.title}
    </button>
  );
}

function MonthGrid({ cursor, today, selected, byDate, onSelect, onOpen }: GridProps) {
  const days = monthGrid(cursor);
  return (
    <div role="grid" aria-label={formatMonthYear(cursor)} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
      <div role="row" className="grid grid-cols-7 border-b border-border bg-surface-muted">
        {WEEKDAY_ORDER.map((d) => (
          <div key={d} role="columnheader" className="py-2 text-center text-xs font-bold text-muted-foreground">
            <span className="hidden sm:inline">{WEEKDAYS[d]}</span>
            <span className="sm:hidden">{WEEKDAYS_SHORT[d]}</span>
          </div>
        ))}
      </div>
      {Array.from({ length: 6 }, (_, w) => (
        <div role="row" key={w} className="grid grid-cols-7 border-b border-border last:border-b-0">
          {days.slice(w * 7, w * 7 + 7).map((date) => {
            const tasks = byDate.get(date) ?? [];
            const inMonth = isSameMonth(date, cursor);
            const isSel = date === selected;
            const pending = tasks.filter((t) => t.status === "pending").length;
            return (
              <div
                role="gridcell"
                key={date}
                aria-selected={isSel}
                className={cn("min-h-16 border-e border-border p-1 last:border-e-0 sm:min-h-28 sm:p-1.5", !inMonth && "bg-surface-muted/50", isSel && "bg-accent/40")}
              >
                <button
                  type="button"
                  onClick={() => onSelect(date)}
                  aria-label={`${formatDate(date, { weekday: true })}، ${tasks.length ? `${formatNumber(tasks.length)} مهام` : "لا توجد مهام"}`}
                  className="flex w-full items-center justify-between rounded-md p-0.5 hover:bg-surface-muted"
                >
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full text-sm",
                      !inMonth && "text-subtle-foreground",
                      date === today && "bg-primary font-bold text-primary-foreground",
                      isSel && date !== today && "ring-2 ring-primary",
                    )}
                  >
                    {parseISODate(date).day}
                  </span>
                  {pending > 0 ? <span className="text-[0.65rem] font-bold text-muted-foreground sm:hidden">{formatNumber(pending)}</span> : null}
                </button>
                {/* Phones: dots. Larger screens: chips. */}
                <div className="mt-1 flex flex-wrap justify-center gap-0.5 sm:hidden">
                  {[...new Set(tasks.map((t) => t.type))].slice(0, 4).map((t) => (
                    <span key={t} className={cn("size-1.5 rounded-full", TASK_TYPE_STYLE[t].dot)} aria-hidden />
                  ))}
                </div>
                <div className="mt-1 hidden flex-col gap-0.5 sm:flex">
                  {tasks.slice(0, 3).map((t) => (
                    <Chip key={t.id} task={t} onOpen={onOpen} />
                  ))}
                  {tasks.length > 3 ? (
                    <button type="button" onClick={() => onSelect(date)} className="text-start text-[0.7rem] font-semibold text-muted-foreground hover:text-brand-700">
                      +{formatNumber(tasks.length - 3)} أخرى
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function WeekGrid({ cursor, today, selected, byDate, onSelect, onOpen }: GridProps) {
  const days = weekDays(cursor);
  return (
    <div className="grid gap-2 sm:grid-cols-7" role="list" aria-label="أيام الأسبوع">
      {days.map((date) => {
        const tasks = byDate.get(date) ?? [];
        return (
          <div
            role="listitem"
            key={date}
            className={cn("flex min-h-24 flex-col gap-1.5 rounded-xl border border-border bg-surface p-2 sm:min-h-72", date === selected && "ring-2 ring-primary")}
          >
            <button type="button" onClick={() => onSelect(date)} className="flex items-center gap-2 rounded-md p-1 text-start hover:bg-surface-muted sm:flex-col sm:items-start sm:gap-0">
              <span className="text-xs font-semibold text-muted-foreground">{WEEKDAYS[weekday(date)]}</span>
              <span className={cn("text-lg font-extrabold", date === today && "text-brand-700")}>{formatShortDate(date)}</span>
            </button>
            {tasks.length === 0 ? <span className="px-1 text-xs text-subtle-foreground">—</span> : null}
            {tasks.map((t) => (
              <Chip key={t.id} task={t} onOpen={onOpen} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
