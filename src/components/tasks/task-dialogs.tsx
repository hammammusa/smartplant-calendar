"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, Check, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAppData } from "@/components/providers/app-data-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { TASK_STATUS_LABELS, TASK_TYPE_LABELS } from "@/domain/labels";
import { taskInputSchema } from "@/domain/schemas";
import { daysUntil, isOverdue, postponedDate } from "@/domain/tasks";
import { TASK_TYPES, type ISODate, type Task } from "@/domain/types";
import { formatDate, formatNumber, relativeDay } from "@/lib/format";
import { TaskTypeBadge } from "./task-type-badge";

type FormValues = z.input<typeof taskInputSchema>;

function TaskForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  defaultValues: FormValues;
  submitLabel: string;
  onSubmit: (v: z.output<typeof taskInputSchema>) => Promise<boolean>;
  onCancel: () => void;
}) {
  const { data } = useAppData();
  const form = useForm<FormValues, unknown, z.output<typeof taskInputSchema>>({
    resolver: zodResolver(taskInputSchema),
    defaultValues,
  });
  const { errors, isSubmitting } = form.formState;
  const activePlantings = data.plantings.filter((p) => p.status === "active");

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(async (v) => {
        await onSubmit(v);
      })}
      className="flex min-h-0 flex-1 flex-col"
    >
      <DialogBody className="grid gap-4">
        <Field label="عنوان المهمة" htmlFor="t-title" error={errors.title?.message}>
          <Input id="t-title" autoFocus aria-invalid={!!errors.title} {...form.register("title")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="التاريخ" htmlFor="t-date" error={errors.dueDate?.message}>
            <Input id="t-date" type="date" aria-invalid={!!errors.dueDate} {...form.register("dueDate")} />
          </Field>
          <Field label="نوع المهمة" htmlFor="t-type" error={errors.type?.message}>
            <Select id="t-type" {...form.register("type")}>
              {TASK_TYPES.map((t) => (
                <option key={t} value={t}>{TASK_TYPE_LABELS[t]}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="مرتبطة بمحصول" htmlFor="t-planting">
          <Select id="t-planting" {...form.register("plantingId", { setValueAs: (v) => (v ? v : null) })}>
            <option value="">بدون ربط</option>
            {activePlantings.map((p) => (
              <option key={p.id} value={p.id}>
                {p.cropName} — زُرع {formatDate(p.plantedOn, { year: false })}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="ملاحظات — اختياري" htmlFor="t-desc" error={errors.description?.message}>
          <Textarea id="t-desc" {...form.register("description")} />
        </Field>
      </DialogBody>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner /> : <Check />} {submitLabel}
        </Button>
        <Button variant="ghost" onClick={onCancel}>إلغاء</Button>
      </DialogFooter>
    </form>
  );
}

export function AddTaskDialog({
  open,
  onOpenChange,
  date,
  plantingId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  date?: ISODate;
  plantingId?: string | null;
}) {
  const { addTask, today } = useAppData();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة مهمة</DialogTitle>
          <DialogDescription>أضف مهمة خاصة بك واربطها بأحد محاصيلك إن أردت.</DialogDescription>
        </DialogHeader>
        {open ? (
          <TaskForm
            defaultValues={{ title: "", description: "", dueDate: date ?? today, type: "custom", plantingId: plantingId ?? null }}
            submitLabel="إضافة المهمة"
            onCancel={() => onOpenChange(false)}
            onSubmit={async (v) => {
              const res = await addTask(v);
              if (!res.ok) {
                toast.error(res.error);
                return false;
              }
              toast.success("تمت إضافة المهمة");
              onOpenChange(false);
              return true;
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** Task details with complete / postpone / edit / delete actions. */
export function TaskDialog({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const { updateTask, deleteTask, data, today } = useAppData();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  // Always show the freshest version of the task after optimistic updates.
  const current = task ? (data.tasks.find((t) => t.id === task.id) ?? task) : null;
  const planting = current?.plantingId ? data.plantings.find((p) => p.id === current.plantingId) : undefined;

  // Reset local UI state when a different task is opened.
  const [shownId, setShownId] = useState(task?.id);
  if (task?.id !== shownId) {
    setShownId(task?.id);
    setEditing(false);
    setConfirmDelete(false);
  }

  async function run(label: string, fn: () => Promise<{ ok: boolean; error?: string }>, success: string, close = false) {
    setBusy(label);
    const res = await fn();
    setBusy(null);
    if (!res.ok) return toast.error(res.error ?? "تعذّر تنفيذ العملية");
    toast.success(success);
    if (close) onClose();
  }

  const diff = current ? daysUntil(current.dueDate, today) : 0;

  return (
    <Dialog open={!!task} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        {current ? (
          editing ? (
            <>
              <DialogHeader>
                <DialogTitle>تعديل المهمة</DialogTitle>
                <DialogDescription className="sr-only">عدّل تفاصيل المهمة ثم احفظ.</DialogDescription>
              </DialogHeader>
              <TaskForm
                defaultValues={{
                  title: current.title,
                  description: current.description ?? "",
                  dueDate: current.dueDate,
                  type: current.type,
                  plantingId: current.plantingId,
                }}
                submitLabel="حفظ التعديلات"
                onCancel={() => setEditing(false)}
                onSubmit={async (v) => {
                  const res = await updateTask(current.id, {
                    title: v.title,
                    description: v.description,
                    dueDate: v.dueDate,
                    type: v.type,
                  });
                  if (!res.ok) {
                    toast.error(res.error);
                    return false;
                  }
                  toast.success("تم حفظ التعديلات");
                  setEditing(false);
                  return true;
                }}
              />
            </>
          ) : (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <TaskTypeBadge type={current.type} />
                  <Badge variant={current.status === "done" ? "solid" : isOverdue(current, today) ? "warning" : "outline"}>
                    {isOverdue(current, today) ? "متأخرة" : TASK_STATUS_LABELS[current.status]}
                  </Badge>
                  {current.postponedCount > 0 ? <Badge variant="neutral">أُجّلت {formatNumber(current.postponedCount)} مرة</Badge> : null}
                </div>
                <DialogTitle className="mt-2">{current.title}</DialogTitle>
                <DialogDescription>
                  {formatDate(current.dueDate, { weekday: true })} · {relativeDay(diff)}
                  {planting ? ` · ${planting.cropName}` : ""}
                </DialogDescription>
              </DialogHeader>
              <DialogBody className="space-y-4">
                {current.description ? <p className="whitespace-pre-line leading-8 text-foreground/85">{current.description}</p> : <p className="text-sm text-subtle-foreground">لا توجد ملاحظات لهذه المهمة.</p>}
                {current.status === "pending" ? (
                  <div className="rounded-xl bg-surface-muted p-3">
                    <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <CalendarClock className="size-4" aria-hidden /> تأجيل المهمة
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[1, 3, 7].map((d) => (
                        <Button
                          key={d}
                          size="sm"
                          variant="outline"
                          disabled={!!busy}
                          onClick={() => {
                            const to = postponedDate(current, d, today);
                            void run(
                              `p${d}`,
                              () => updateTask(current.id, { dueDate: to, postponedCount: current.postponedCount + 1 }),
                              `أُجّلت المهمة إلى ${formatDate(to, { year: false })}`,
                            );
                          }}
                        >
                          {busy === `p${d}` ? <Spinner /> : null}
                          {d === 1 ? "يوم واحد" : d === 3 ? "3 أيام" : "أسبوع"}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : null}
                {confirmDelete ? (
                  <div role="alert" className="rounded-xl border border-danger/20 bg-danger-soft p-3 text-sm">
                    <p className="mb-2 font-semibold text-danger">هل تريد حذف هذه المهمة نهائيًا؟</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="danger" disabled={!!busy} onClick={() => run("del", () => deleteTask(current.id), "تم حذف المهمة", true)}>
                        {busy === "del" ? <Spinner /> : <Trash2 />} نعم، احذفها
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>تراجع</Button>
                    </div>
                  </div>
                ) : null}
              </DialogBody>
              <DialogFooter>
                {current.status === "done" ? (
                  <Button variant="outline" disabled={!!busy} onClick={() => run("undo", () => updateTask(current.id, { status: "pending" }), "أُعيدت المهمة إلى قيد الانتظار")}>
                    {busy === "undo" ? <Spinner /> : <RotateCcw />} إلغاء الإكمال
                  </Button>
                ) : (
                  <Button disabled={!!busy} onClick={() => run("done", () => updateTask(current.id, { status: "done" }), "أحسنت! تم وضع المهمة كمكتملة")}>
                    {busy === "done" ? <Spinner /> : <Check />} وضع كمكتملة
                  </Button>
                )}
                <Button variant="outline" onClick={() => setEditing(true)} disabled={!!busy}>
                  <Pencil /> تعديل
                </Button>
                <Button variant="danger-ghost" className="ms-auto" onClick={() => setConfirmDelete(true)} disabled={!!busy}>
                  <Trash2 /> حذف
                </Button>
              </DialogFooter>
            </>
          )
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
