import { addDays, compareISO, diffDays } from "@/lib/dates";
import type { ISODate, Task, TaskStatus, TaskType } from "./types";

export function isOverdue(task: Pick<Task, "status" | "dueDate">, today: ISODate): boolean {
  return task.status === "pending" && compareISO(task.dueDate, today) < 0;
}

export function sortTasks<T extends Pick<Task, "dueDate" | "title">>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => compareISO(a.dueDate, b.dueDate) || a.title.localeCompare(b.title, "ar"));
}

export function tasksOn<T extends Pick<Task, "dueDate">>(tasks: T[], date: ISODate): T[] {
  return tasks.filter((t) => t.dueDate === date);
}

export function groupByDate<T extends Pick<Task, "dueDate">>(tasks: T[]): Map<ISODate, T[]> {
  const map = new Map<ISODate, T[]>();
  for (const t of tasks) {
    const list = map.get(t.dueDate);
    if (list) list.push(t);
    else map.set(t.dueDate, [t]);
  }
  return map;
}

export interface TaskBuckets<T> {
  overdue: T[];
  today: T[];
  upcoming: T[];
}

/** Pending tasks split into overdue / due today / next `days` days. */
export function bucketTasks<T extends Task>(tasks: T[], today: ISODate, days = 7): TaskBuckets<T> {
  const limit = addDays(today, days);
  const pending = sortTasks(tasks.filter((t) => t.status === "pending"));
  return {
    overdue: pending.filter((t) => t.dueDate < today),
    today: pending.filter((t) => t.dueDate === today),
    upcoming: pending.filter((t) => t.dueDate > today && t.dueDate <= limit),
  };
}

/** New due date when postponing; never earlier than today. */
export function postponedDate(task: Pick<Task, "dueDate">, days: number, today: ISODate): ISODate {
  const base = compareISO(task.dueDate, today) < 0 ? today : task.dueDate;
  return addDays(base, Math.max(1, days));
}

export interface TaskFilters {
  plantingId?: string;
  gardenId?: string;
  type?: TaskType | "";
  status?: TaskStatus | "overdue" | "";
}

export function filterTasks<T extends Task>(tasks: T[], filters: TaskFilters, today: ISODate): T[] {
  return tasks.filter((t) => {
    if (filters.plantingId && t.plantingId !== filters.plantingId) return false;
    if (filters.gardenId && t.gardenId !== filters.gardenId) return false;
    if (filters.type && t.type !== filters.type) return false;
    if (filters.status === "overdue") return isOverdue(t, today);
    if (filters.status && t.status !== filters.status) return false;
    return true;
  });
}

export function countByType(tasks: Task[]): Record<TaskType, number> {
  const counts = {
    soil_prep: 0,
    planting: 0,
    irrigation: 0,
    fertilizing: 0,
    care: 0,
    pest_check: 0,
    harvest: 0,
    custom: 0,
  } satisfies Record<TaskType, number>;
  for (const t of tasks) counts[t.type] += 1;
  return counts;
}

export function daysUntil(date: ISODate, today: ISODate): number {
  return diffDays(today, date);
}
