/**
 * Date-only helpers. All agricultural scheduling works on calendar dates
 * (`YYYY-MM-DD`) so that tasks never drift across days because of time zones.
 * Arithmetic is done in UTC on purpose; "today" is resolved in the user's
 * time zone (default Asia/Hebron).
 */
import type { ISODate } from "@/domain/types";

export const DEFAULT_TIMEZONE = "Asia/Hebron";
/** Week starts on Saturday (السبت), common in Levant calendars. 0 = Sunday. */
export const WEEK_STARTS_ON = 6;

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidISODate(value: string): value is ISODate {
  const m = ISO_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mo < 1 || mo > 12 || d < 1) return false;
  return d <= daysInMonth(y, mo);
}

export function parseISODate(value: ISODate): { year: number; month: number; day: number } {
  const m = ISO_RE.exec(value);
  if (!m) throw new Error(`Invalid ISO date: ${value}`);
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

export function toISODate(year: number, month: number, day: number): ISODate {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function toUTC(value: ISODate): Date {
  const { year, month, day } = parseISODate(value);
  return new Date(Date.UTC(year, month - 1, day));
}

function fromUTC(date: Date): ISODate {
  return toISODate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function addDays(value: ISODate, days: number): ISODate {
  const d = toUTC(value);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUTC(d);
}

/** Adds months, clamping the day to the target month's length. */
export function addMonths(value: ISODate, months: number): ISODate {
  const { year, month, day } = parseISODate(value);
  const total = year * 12 + (month - 1) + months;
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  return toISODate(y, m, Math.min(day, daysInMonth(y, m)));
}

/** Whole days from `a` to `b` (positive when b is later). */
export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((toUTC(b).getTime() - toUTC(a).getTime()) / 86_400_000);
}

/** 0 = Sunday … 6 = Saturday. */
export function weekday(value: ISODate): number {
  return toUTC(value).getUTCDay();
}

export function startOfWeek(value: ISODate, weekStartsOn = WEEK_STARTS_ON): ISODate {
  const offset = (weekday(value) - weekStartsOn + 7) % 7;
  return addDays(value, -offset);
}

export function startOfMonth(value: ISODate): ISODate {
  const { year, month } = parseISODate(value);
  return toISODate(year, month, 1);
}

export function endOfMonth(value: ISODate): ISODate {
  const { year, month } = parseISODate(value);
  return toISODate(year, month, daysInMonth(year, month));
}

/** 6 weeks × 7 days grid covering the month of `value`. */
export function monthGrid(value: ISODate, weekStartsOn = WEEK_STARTS_ON): ISODate[] {
  const first = startOfWeek(startOfMonth(value), weekStartsOn);
  return Array.from({ length: 42 }, (_, i) => addDays(first, i));
}

export function weekDays(value: ISODate, weekStartsOn = WEEK_STARTS_ON): ISODate[] {
  const first = startOfWeek(value, weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => addDays(first, i));
}

export function isSameMonth(a: ISODate, b: ISODate): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

export function compareISO(a: ISODate, b: ISODate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** The current calendar date in the given IANA time zone. */
export function todayInTimeZone(tz: string = DEFAULT_TIMEZONE, now: Date = new Date()): ISODate {
  const zone = isValidTimeZone(tz) ? tz : DEFAULT_TIMEZONE;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Month (1–12) of an ISO date. */
export function monthOf(value: ISODate): number {
  return parseISODate(value).month;
}
