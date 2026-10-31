import {
  Bug,
  Droplets,
  FlaskConical,
  HandHeart,
  PencilLine,
  Shovel,
  Sprout,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { TASK_TYPE_LABELS } from "@/domain/labels";
import type { TaskType } from "@/domain/types";
import { cn } from "@/lib/utils";

export const TASK_TYPE_STYLE: Record<TaskType, { icon: LucideIcon; text: string; bg: string; dot: string }> = {
  soil_prep: { icon: Shovel, text: "text-[var(--task-soil)]", bg: "bg-[var(--task-soil-soft)]", dot: "bg-[var(--task-soil)]" },
  planting: { icon: Sprout, text: "text-[var(--task-planting)]", bg: "bg-[var(--task-planting-soft)]", dot: "bg-[var(--task-planting)]" },
  irrigation: { icon: Droplets, text: "text-[var(--task-irrigation)]", bg: "bg-[var(--task-irrigation-soft)]", dot: "bg-[var(--task-irrigation)]" },
  fertilizing: { icon: FlaskConical, text: "text-[var(--task-fertilizing)]", bg: "bg-[var(--task-fertilizing-soft)]", dot: "bg-[var(--task-fertilizing)]" },
  care: { icon: HandHeart, text: "text-[var(--task-care)]", bg: "bg-[var(--task-care-soft)]", dot: "bg-[var(--task-care)]" },
  pest_check: { icon: Bug, text: "text-[var(--task-pest)]", bg: "bg-[var(--task-pest-soft)]", dot: "bg-[var(--task-pest)]" },
  harvest: { icon: Wheat, text: "text-[var(--task-harvest)]", bg: "bg-[var(--task-harvest-soft)]", dot: "bg-[var(--task-harvest)]" },
  custom: { icon: PencilLine, text: "text-[var(--task-custom)]", bg: "bg-[var(--task-custom-soft)]", dot: "bg-[var(--task-custom)]" },
};

export function TaskTypeBadge({ type, className }: { type: TaskType; className?: string }) {
  const s = TASK_TYPE_STYLE[type];
  const Icon = s.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", s.bg, s.text, className)}>
      <Icon className="size-3.5" aria-hidden />
      {TASK_TYPE_LABELS[type]}
    </span>
  );
}

export function TaskTypeIcon({ type, className }: { type: TaskType; className?: string }) {
  const s = TASK_TYPE_STYLE[type];
  const Icon = s.icon;
  return (
    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", s.bg, s.text, className)} aria-hidden>
      <Icon className="size-4.5" />
    </span>
  );
}

export function TaskTypeDot({ type, className }: { type: TaskType; className?: string }) {
  return <span aria-hidden className={cn("size-2.5 shrink-0 rounded-full", TASK_TYPE_STYLE[type].dot, className)} />;
}
