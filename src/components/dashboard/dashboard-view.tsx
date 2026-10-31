"use client";

import { AlarmClock, CalendarDays, CheckCircle2, ListChecks, MoreVertical, Plus, Sprout, Trash2, Wheat } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CropArt } from "@/components/brand/crop-art";
import { MiniMonth } from "@/components/calendar/mini-month";
import { useAppData } from "@/components/providers/app-data-provider";
import { AddTaskDialog, TaskDialog } from "@/components/tasks/task-dialogs";
import { TaskRow } from "@/components/tasks/task-row";
import { TASK_TYPE_STYLE } from "@/components/tasks/task-type-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, EmptyState, Spinner } from "@/components/ui/feedback";
import { Skeleton } from "@/components/ui/skeleton";
import { WeatherCard } from "@/components/weather/weather-widget";
import { PLANTING_STATUS_LABELS, SPACE_TYPE_LABELS, TASK_TYPE_LABELS } from "@/domain/labels";
import { bucketTasks, countByType, daysUntil } from "@/domain/tasks";
import { TASK_TYPES, type ISODate, type Planting, type Task, type TaskType } from "@/domain/types";
import { addDays, diffDays, startOfMonth } from "@/lib/dates";
import { formatDate, formatNumber, relativeDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function Stat({ icon: Icon, label, value, tone, href }: { icon: typeof Sprout; label: string; value: number; tone: string; href: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-xs transition-colors hover:border-border-strong">
      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", tone)}>
        <Icon className="size-5" aria-hidden />
      </span>
      <span>
        <span className="block text-2xl font-extrabold leading-tight">{formatNumber(value)}</span>
        <span className="block text-xs font-semibold text-muted-foreground">{label}</span>
      </span>
    </Link>
  );
}

export function DashboardView() {
  const app = useAppData();
  const { data, today, mode, user } = app;
  const params = useSearchParams();
  const [openTask, setOpenTask] = useState<Task | null>(null);
  const [adding, setAdding] = useState(false);
  const [month, setMonth] = useState<ISODate>(startOfMonth(today));
  const [manage, setManage] = useState<Planting | null>(null);

  const buckets = useMemo(() => bucketTasks(data.tasks, today, 7), [data.tasks, today]);
  const active = data.plantings.filter((p) => p.status === "active");
  const harvests = active
    .filter((p) => p.expectedHarvestStart && p.expectedHarvestEnd && p.expectedHarvestEnd >= today)
    .sort((a, b) => (a.expectedHarvestStart! < b.expectedHarvestStart! ? -1 : 1));
  const typesByDate = useMemo(() => {
    const m = new Map<ISODate, TaskType[]>();
    for (const t of data.tasks) if (t.status === "pending") m.set(t.dueDate, [...(m.get(t.dueDate) ?? []), t.type]);
    return m;
  }, [data.tasks]);

  // Activity over the last 30 days: completed tasks by type.
  const since = addDays(today, -30);
  const recentDone = data.tasks.filter((t) => t.status === "done" && t.dueDate >= since && t.dueDate <= today);
  const recentDue = data.tasks.filter((t) => t.dueDate >= since && t.dueDate <= today);
  const doneByType = countByType(recentDone);
  const maxType = Math.max(1, ...Object.values(doneByType));
  const completion = recentDue.length ? Math.round((recentDone.length / recentDue.length) * 100) : null;

  if (mode === "loading") {
    return (
      <div role="status" aria-label="جارٍ تحميل لوحة التحكم" className="grid gap-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  const name = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0];
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: app.timezone }).format(new Date()));

  return (
    <div className="flex flex-col gap-6">
      {params.get("denied") === "admin" ? <Alert tone="danger">لا تملك صلاحية الوصول إلى لوحة الإدارة.</Alert> : null}
      {app.error ? <Alert tone="danger">{app.error}</Alert> : null}

      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-l from-brand-700 to-brand-600 p-6 text-primary-foreground shadow-md sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="text-sm text-primary-foreground/80">{formatDate(today, { weekday: true, alt: true })}</p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
            {hour < 12 ? "صباح الخير" : "مساء الخير"}
            {name ? ` يا ${name}` : ""}
          </h1>
          <p className="mt-1 text-primary-foreground/85">
            {buckets.today.length + buckets.overdue.length
              ? `لديك ${formatNumber(buckets.today.length)} مهام اليوم${buckets.overdue.length ? ` و${formatNumber(buckets.overdue.length)} متأخرة` : ""}.`
              : data.tasks.length
                ? "لا توجد مهام مستحقة اليوم. استمتع بحديقتك!"
                : "ابدأ بإنشاء خطتك الزراعية الأولى."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="bg-white text-brand-700 hover:bg-brand-50">
            <Link href="/planner"><Sprout /> إنشاء خطة زراعية</Link>
          </Button>
          <Button variant="ghost" className="text-primary-foreground hover:bg-white/10" onClick={() => setAdding(true)}>
            <Plus /> مهمة جديدة
          </Button>
        </div>
      </div>

      {mode === "local" ? (
        <Alert tone="warning" title={app.user ? undefined : "بيانات هذا المتصفح"}>
          تعرض هذه اللوحة البيانات المحفوظة في هذا المتصفح فقط.{" "}
          {data.tasks.length === 0 ? "لا توجد بيانات بعد — لن نعرض أرقامًا تجريبية." : null}
        </Alert>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Sprout} label="محاصيل نشطة" value={active.length} tone="bg-accent text-accent-foreground" href="#my-crops" />
        <Stat icon={ListChecks} label="مهام اليوم" value={buckets.today.length} tone="bg-info-soft text-info" href="/tasks" />
        <Stat icon={AlarmClock} label="مهام متأخرة" value={buckets.overdue.length} tone="bg-warning-soft text-warning" href="/tasks" />
        <Stat icon={CalendarDays} label="خلال 7 أيام" value={buckets.upcoming.length} tone="bg-[var(--task-fertilizing-soft)] text-[var(--task-fertilizing)]" href="/calendar" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <section aria-labelledby="today-tasks" className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="today-tasks" className="font-bold">مهام اليوم والمتأخرة</h2>
              <Link href="/tasks" className="text-sm font-semibold text-brand-600 hover:underline">كل المهام</Link>
            </div>
            {buckets.today.length + buckets.overdue.length === 0 ? (
              <p className="flex items-center gap-2 rounded-xl bg-surface-muted p-4 text-sm text-muted-foreground">
                <CheckCircle2 className="size-5 text-success" aria-hidden /> لا توجد مهام مستحقة الآن.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {[...buckets.overdue, ...buckets.today].slice(0, 8).map((t) => (
                  <TaskRow key={t.id} task={t} onOpen={setOpenTask} />
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="upcoming" className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
            <h2 id="upcoming" className="mb-3 font-bold">المهام القادمة</h2>
            {buckets.upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد مهام في الأيام السبعة القادمة.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {buckets.upcoming.slice(0, 6).map((t) => (
                  <TaskRow key={t.id} task={t} onOpen={setOpenTask} />
                ))}
              </ul>
            )}
          </section>

          <section id="my-crops" aria-labelledby="crops-h" className="scroll-mt-24">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="crops-h" className="text-lg font-bold">محاصيلي</h2>
              <Button asChild size="sm" variant="outline"><Link href="/planner"><Plus /> إضافة محصول</Link></Button>
            </div>
            {data.plantings.length === 0 ? (
              <EmptyState
                icon={Sprout}
                title="لم تضف أي محصول بعد"
                description="اختر محصولًا وحدد تاريخ زراعته لتحصل على خطة كاملة."
                action={<Button asChild><Link href="/planner">ابدأ خطتك الزراعية</Link></Button>}
              />
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {data.plantings.map((p) => {
                  const garden = data.gardens.find((g) => g.id === p.gardenId);
                  const tasks = data.tasks.filter((t) => t.plantingId === p.id);
                  const done = tasks.filter((t) => t.status === "done").length;
                  const age = diffDays(p.plantedOn, today);
                  return (
                    <li key={p.id} className="flex gap-3 rounded-2xl border border-border bg-surface p-3 shadow-xs">
                      <Link href={`/crops/${p.cropSlug}`} className="size-20 shrink-0 overflow-hidden rounded-xl" aria-label={`دليل ${p.cropName}`}>
                        <CropArt slug={p.cropSlug} />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-bold">{p.cropName}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {garden ? `${garden.name} · ${SPACE_TYPE_LABELS[garden.spaceType]}` : ""}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon-sm" aria-label={`إدارة ${p.cropName}`} onClick={() => setManage(p)}>
                            <MoreVertical />
                          </Button>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {age >= 0 ? `زُرع منذ ${formatNumber(age)} يومًا` : `يُزرع ${relativeDay(-age)}`} · {formatDate(p.plantedOn, { year: false })}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted" role="progressbar" aria-valuemin={0} aria-valuemax={tasks.length} aria-valuenow={done} aria-label="المهام المنجزة">
                            <div className="h-full rounded-full bg-lime-600" style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }} />
                          </div>
                          <span className="text-[0.7rem] text-muted-foreground">{formatNumber(done)}/{formatNumber(tasks.length)}</span>
                        </div>
                        {p.status !== "active" ? <Badge variant="neutral" className="mt-2">{PLANTING_STATUS_LABELS[p.status]}</Badge> : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <WeatherCard />

          <section aria-labelledby="mini-cal" className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
            <h2 id="mini-cal" className="sr-only">تقويم مصغر</h2>
            <MiniMonth month={month} today={today} typesByDate={typesByDate} onMonthChange={setMonth} />
            <Button asChild variant="outline" size="sm" className="mt-3 w-full"><Link href="/calendar">فتح الرزنامة</Link></Button>
          </section>

          <section aria-labelledby="harvests" className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
            <h2 id="harvests" className="mb-3 flex items-center gap-2 font-bold"><Wheat className="size-5 text-[var(--task-harvest)]" aria-hidden /> مواعيد الحصاد المتوقعة</h2>
            {harvests.length === 0 ? (
              <p className="text-sm text-muted-foreground">لا توجد مواعيد حصاد متوقعة لمحاصيلك النشطة.</p>
            ) : (
              <ul className="space-y-2">
                {harvests.slice(0, 5).map((p) => {
                  const d = daysUntil(p.expectedHarvestStart!, today);
                  return (
                    <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-semibold">{p.cropName}</span>
                      <span className="text-muted-foreground">
                        {d > 0 ? `بعد ${formatNumber(d)} يومًا تقريبًا` : "نافذة الحصاد الآن"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-3 text-xs text-subtle-foreground">مواعيد تقديرية حسب البيانات الأولية للمحصول.</p>
          </section>

          <section aria-labelledby="activity" className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
            <h2 id="activity" className="mb-1 font-bold">ملخص الأنشطة</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              آخر 30 يومًا · {completion == null ? "لا توجد مهام مستحقة بعد" : `نسبة الإنجاز ${formatNumber(completion)}٪ (${formatNumber(recentDone.length)} من ${formatNumber(recentDue.length)})`}
            </p>
            <ul className="space-y-2">
              {TASK_TYPES.filter((t) => t !== "custom" || doneByType.custom > 0).map((t) => (
                <li key={t} className="grid grid-cols-[6rem_1fr_2rem] items-center gap-2 text-xs">
                  <span className="text-muted-foreground">{TASK_TYPE_LABELS[t]}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-surface-muted">
                    <span className={cn("block h-full rounded-full", TASK_TYPE_STYLE[t].dot)} style={{ width: `${(doneByType[t] / maxType) * 100}%` }} />
                  </span>
                  <span className="text-end font-semibold">{formatNumber(doneByType[t])}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <TaskDialog task={openTask} onClose={() => setOpenTask(null)} />
      <AddTaskDialog open={adding} onOpenChange={setAdding} />
      <ManagePlantingDialog planting={manage} onClose={() => setManage(null)} />
    </div>
  );
}

function ManagePlantingDialog({ planting, onClose }: { planting: Planting | null; onClose: () => void }) {
  const { setPlantingStatus, deletePlanting } = useAppData();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  if (!planting) return null;
  const act = async (key: string, fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) => {
    setBusy(key);
    const res = await fn();
    setBusy(null);
    if (!res.ok) return toast.error(res.error);
    toast.success(msg);
    setConfirm(false);
    onClose();
  };
  return (
    <Dialog open onOpenChange={(v) => !v && (setConfirm(false), onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{planting.cropName}</DialogTitle>
          <DialogDescription>الحالة الحالية: {PLANTING_STATUS_LABELS[planting.status]}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-3 text-sm">
          <p className="text-muted-foreground">عند وضع المحصول كمحصود أو مؤرشف تبقى مهامه محفوظة، ويمكنك حذفه نهائيًا مع كل مهامه.</p>
          {confirm ? (
            <div role="alert" className="rounded-xl border border-danger/20 bg-danger-soft p-3">
              <p className="mb-2 font-semibold text-danger">سيُحذف المحصول وجميع مهامه نهائيًا. هل أنت متأكد؟</p>
              <Button size="sm" variant="danger" disabled={!!busy} onClick={() => act("del", () => deletePlanting(planting.id), "تم حذف المحصول ومهامه")}>
                {busy === "del" ? <Spinner /> : <Trash2 />} نعم، احذف
              </Button>
            </div>
          ) : null}
        </DialogBody>
        <DialogFooter>
          {planting.status === "active" ? (
            <Button disabled={!!busy} onClick={() => act("h", () => setPlantingStatus(planting.id, "harvested"), "تم تحديث حالة المحصول")}>
              {busy === "h" ? <Spinner /> : <Wheat />} تم الحصاد
            </Button>
          ) : (
            <Button disabled={!!busy} onClick={() => act("a", () => setPlantingStatus(planting.id, "active"), "أُعيد المحصول إلى النشطة")}>
              إعادة إلى النشطة
            </Button>
          )}
          {planting.status !== "archived" ? (
            <Button variant="outline" disabled={!!busy} onClick={() => act("ar", () => setPlantingStatus(planting.id, "archived"), "تمت أرشفة المحصول")}>
              أرشفة
            </Button>
          ) : null}
          <Button variant="danger-ghost" className="ms-auto" onClick={() => setConfirm(true)}>
            <Trash2 /> حذف
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
