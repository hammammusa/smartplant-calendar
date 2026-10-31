"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ISODate, TaskType } from "@/domain/types";
import { addMonths, isSameMonth, monthGrid, parseISODate, WEEK_STARTS_ON } from "@/lib/dates";
import { formatDate, formatMonthYear, WEEKDAYS_SHORT } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TASK_TYPE_STYLE } from "@/components/tasks/task-type-badge";

export const WEEKDAY_ORDER = Array.from({ length: 7 }, (_, i) => (WEEK_STARTS_ON + i) % 7);

/** Compact month calendar with coloured task dots. */
export function MiniMonth({
  month,
  today,
  selected,
  typesByDate,
  onSelect,
  onMonthChange,
  className,
}: {
  month: ISODate;
  today: ISODate;
  selected?: ISODate | null;
  typesByDate: Map<ISODate, TaskType[]>;
  onSelect?: (date: ISODate) => void;
  onMonthChange?: (month: ISODate) => void;
  className?: string;
}) {
  const days = monthGrid(month);
  return (
    <div className={cn("select-none", className)}>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-bold" aria-live="polite">
          {formatMonthYear(month)}
        </p>
        {onMonthChange ? (
          <div className="flex gap-1">
            {/* In RTL the "previous" arrow points right. */}
            <button
              type="button"
              onClick={() => onMonthChange(addMonths(month, -1))}
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-muted"
              aria-label="الشهر السابق"
            >
              <ChevronRight className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onMonthChange(addMonths(month, 1))}
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-muted"
              aria-label="الشهر التالي"
            >
              <ChevronLeft className="size-4" />
            </button>
          </div>
        ) : null}
      </div>
      <div role="grid" aria-label={formatMonthYear(month)} className="grid grid-cols-7 gap-y-1 text-center">
        <div role="row" className="contents">
          {WEEKDAY_ORDER.map((d) => (
            <div key={d} role="columnheader" className="pb-1 text-[0.68rem] font-semibold text-subtle-foreground">
              {WEEKDAYS_SHORT[d]}
            </div>
          ))}
        </div>
        {Array.from({ length: 6 }, (_, w) => (
          <div role="row" className="contents" key={w}>
            {days.slice(w * 7, w * 7 + 7).map((date) => {
              const inMonth = isSameMonth(date, month);
              const types = typesByDate.get(date) ?? [];
              const unique = [...new Set(types)].slice(0, 3);
              const isToday = date === today;
              const isSelected = date === selected;
              return (
                <div role="gridcell" key={date} aria-selected={isSelected || undefined}>
                  <button
                    type="button"
                    disabled={!onSelect}
                    onClick={() => onSelect?.(date)}
                    aria-label={`${formatDate(date, { weekday: true })}${types.length ? `، ${types.length} مهام` : ""}`}
                    className={cn(
                      "mx-auto flex size-9 flex-col items-center justify-center rounded-lg text-sm transition-colors disabled:cursor-default",
                      !inMonth && "text-subtle-foreground/50",
                      inMonth && "text-foreground",
                      onSelect && "hover:bg-surface-muted",
                      isToday && "font-extrabold text-brand-700 ring-1 ring-lime-600",
                      isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                    )}
                  >
                    <span className="leading-none">{parseISODate(date).day}</span>
                    <span className="mt-1 flex h-1.5 gap-0.5">
                      {unique.map((t) => (
                        <span
                          key={t}
                          className={cn("size-1.5 rounded-full", isSelected ? "bg-primary-foreground" : TASK_TYPE_STYLE[t].dot)}
                        />
                      ))}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
