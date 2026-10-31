"use client";

import { ListChecks, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeArabic } from "@/domain/crop-filter";
import { TASK_TYPE_LABELS } from "@/domain/labels";
import { groupByDate, isOverdue, sortTasks } from "@/domain/tasks";
import { TASK_TYPES, type Task, type TaskType } from "@/domain/types";
import { addDays } from "@/lib/dates";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AddTaskDialog, TaskDialog } from "./task-dialogs";
import { TaskRow } from "./task-row";

type Tab = "now" | "upcoming" | "done" | "all";

export function TasksManager() {
  const { data, today, mode, error } = useAppData();
  const [tab, setTab] = useState<Tab>("now");
  const [type, setType] = useState<TaskType | "">("");
  const [plantingId, setPlantingId] = useState("");
  const [q, setQ] = useState("");
  const [openTask, setOpenTask] = useState<Task | null>(null);
  const [adding, setAdding] = useState(false);

  const base = useMemo(() => {
    const nq = normalizeArabic(q);
    return data.tasks.filter(
      (t) =>
        (!type || t.type === type) &&
        (!plantingId || t.plantingId === plantingId) &&
        (!nq || normalizeArabic(`${t.title} ${t.description ?? ""}`).includes(nq)),
    );
  }, [data.tasks, type, plantingId, q]);

  const tabs: { id: Tab; label: string; list: Task[] }[] = useMemo(() => {
    const pending = base.filter((t) => t.status === "pending");
    return [
      { id: "now", label: "اليوم والمتأخرة", list: sortTasks(pending.filter((t) => t.dueDate <= today)) },
      { id: "upcoming", label: "القادمة", list: sortTasks(pending.filter((t) => t.dueDate > today)) },
      { id: "done", label: "المكتملة", list: sortTasks(base.filter((t) => t.status !== "pending")).reverse() },
      { id: "all", label: "الكل", list: sortTasks(base) },
    ];
  }, [base, today]);

  if (mode === "loading") {
    return (
      <div role="status" aria-label="جارٍ تحميل المهام" className="space-y-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const current = tabs.find((t) => t.id === tab)!;
  // Upcoming can be long (irrigation checks): show the next 60 days by default.
  const visible = tab === "upcoming" ? current.list.filter((t) => t.dueDate <= addDays(today, 60)) : current.list;
  const overdueCount = tabs[0].list.filter((t) => isOverdue(t, today)).length;

  return (
    <div className="flex flex-col gap-4">
      {error ? <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p> : null}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-3 shadow-xs sm:p-4">
        <div role="tablist" aria-label="تصنيف المهام" className="flex gap-1 overflow-x-auto rounded-xl bg-surface-muted p-1 scrollbar-none">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn("flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground", tab === t.id && "bg-surface text-brand-700 shadow-xs")}
            >
              {t.label}
              <span className={cn("rounded-full px-1.5 text-xs", t.id === "now" && overdueCount ? "bg-warning text-white" : "bg-border")}>{formatNumber(t.list.length)}</span>
            </button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_12rem_12rem_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" aria-hidden />
            <Input type="search" aria-label="بحث في المهام" placeholder="بحث في المهام" value={q} onChange={(e) => setQ(e.target.value)} className="ps-9" />
          </div>
          <Select aria-label="نوع المهمة" value={type} onChange={(e) => setType(e.target.value as TaskType | "")}>
            <option value="">كل الأنواع</option>
            {TASK_TYPES.map((t) => (
              <option key={t} value={t}>{TASK_TYPE_LABELS[t]}</option>
            ))}
          </Select>
          <Select aria-label="المحصول" value={plantingId} onChange={(e) => setPlantingId(e.target.value)}>
            <option value="">كل المحاصيل</option>
            {data.plantings.map((p) => (
              <option key={p.id} value={p.id}>{p.cropName}</option>
            ))}
          </Select>
          <Button onClick={() => setAdding(true)}>
            <Plus /> مهمة جديدة
          </Button>
        </div>
      </div>

      <section role="tabpanel" aria-label={current.label}>
        {data.tasks.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="لا توجد مهام بعد"
            description="أنشئ خطة زراعية لتولّد المهام تلقائيًا، أو أضف مهامك الخاصة."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild><Link href="/planner">أنشئ خطة زراعية</Link></Button>
                <Button variant="outline" onClick={() => setAdding(true)}><Plus /> مهمة خاصة</Button>
              </div>
            }
          />
        ) : visible.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border-strong p-8 text-center text-sm text-muted-foreground">
            {tab === "now" ? "لا توجد مهام لليوم أو متأخرة. عمل رائع!" : "لا توجد مهام مطابقة."}
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {[...groupByDate(visible).entries()].map(([date, tasks]) => (
              <div key={date}>
                <h3 className={cn("mb-2 text-sm font-bold", date < today && tab === "now" ? "text-warning" : date === today ? "text-brand-700" : "")}>
                  {formatDate(date, { weekday: true })}
                  {date === today ? " · اليوم" : ""}
                </h3>
                <ul className="flex flex-col gap-2">
                  {tasks.map((t) => (
                    <TaskRow key={t.id} task={t} onOpen={setOpenTask} showDate={false} />
                  ))}
                </ul>
              </div>
            ))}
            {tab === "upcoming" && visible.length < current.list.length ? (
              <p className="text-center text-sm text-muted-foreground">
                تُعرض مهام الستين يومًا القادمة. توجد {formatNumber(current.list.length - visible.length)} مهمة لاحقة يمكنك رؤيتها في الرزنامة أو في تبويب «الكل».
              </p>
            ) : null}
          </div>
        )}
      </section>

      <TaskDialog task={openTask} onClose={() => setOpenTask(null)} />
      <AddTaskDialog open={adding} onOpenChange={setAdding} />
    </div>
  );
}
