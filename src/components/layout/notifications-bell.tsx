"use client";

import { Bell, BellRing } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { bucketTasks, daysUntil } from "@/domain/tasks";
import { formatNumber, relativeDay } from "@/lib/format";
import { TaskTypeDot } from "@/components/tasks/task-type-badge";

/** In-app reminders built from the user's real tasks (overdue / today / next 3 days). */
export function NotificationsBell() {
  const { data, today, mode } = useAppData();
  const buckets = useMemo(() => bucketTasks(data.tasks, today, 3), [data.tasks, today]);
  const urgent = buckets.overdue.length + buckets.today.length;
  const items = [...buckets.overdue, ...buckets.today, ...buckets.upcoming].slice(0, 12);
  if (mode === "loading") return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={urgent > 0 ? `التنبيهات: ${formatNumber(urgent)} مهام تحتاج انتباهك` : "التنبيهات"}
        >
          {urgent > 0 ? <BellRing className="size-5 text-warning" /> : <Bell className="size-5" />}
          {urgent > 0 ? (
            <span className="absolute end-1 top-1 flex min-w-4.5 items-center justify-center rounded-full bg-warning px-1 text-[0.65rem] font-bold leading-4.5 text-white">
              {urgent > 99 ? "+99" : formatNumber(urgent)}
            </span>
          ) : null}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>التنبيهات</DialogTitle>
          <DialogDescription>تذكيرات داخل المنصة للمهام المتأخرة والقريبة. لا تُرسل حاليًا رسائل بريد أو إشعارات خارجية.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          {items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">لا توجد مهام متأخرة أو قريبة. كل شيء على ما يرام.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {items.map((t) => {
                const diff = daysUntil(t.dueDate, today);
                return (
                  <li key={t.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <TaskTypeDot type={t.type} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{t.title}</p>
                      <p className={diff < 0 ? "text-xs font-semibold text-warning" : "text-xs text-muted-foreground"}>
                        {diff < 0 ? `متأخرة — ${relativeDay(diff)}` : relativeDay(diff)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <Button asChild variant="outline" className="mt-4 w-full">
            <Link href="/tasks">عرض كل المهام</Link>
          </Button>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
