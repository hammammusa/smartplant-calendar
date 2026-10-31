/**
 * Arabic presentation helpers. Month names follow the Levant (شامي) naming,
 * with the common alternative shown where space allows, because both forms are
 * used in Palestine and Jordan. Digits use the Western set (0-9) for clarity in
 * forms; switch NUMBER_LOCALE to "ar-u-nu-arab" for Arabic-Indic digits.
 */
import type { ISODate } from "@/domain/types";
import { parseISODate, weekday } from "@/lib/dates";

export const NUMBER_LOCALE = "ar-u-nu-latn";

export const LEVANT_MONTHS = [
  "كانون الثاني",
  "شباط",
  "آذار",
  "نيسان",
  "أيار",
  "حزيران",
  "تموز",
  "آب",
  "أيلول",
  "تشرين الأول",
  "تشرين الثاني",
  "كانون الأول",
] as const;

export const ALT_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
] as const;

/** Index 0 = Sunday. */
export const WEEKDAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"] as const;
export const WEEKDAYS_SHORT = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"] as const;

export function monthName(month: number, withAlt = false): string {
  const name = LEVANT_MONTHS[month - 1] ?? "";
  return withAlt ? `${name} (${ALT_MONTHS[month - 1]})` : name;
}

export function formatNumber(value: number, maximumFractionDigits = 1): string {
  return new Intl.NumberFormat(NUMBER_LOCALE, { maximumFractionDigits }).format(value);
}

/** e.g. "الثلاثاء 14 نيسان 2026" */
export function formatDate(
  value: ISODate,
  opts: { weekday?: boolean; year?: boolean; alt?: boolean } = {},
): string {
  const { year, month, day } = parseISODate(value);
  const parts: string[] = [];
  if (opts.weekday) parts.push(WEEKDAYS[weekday(value)]);
  parts.push(`${day} ${monthName(month, opts.alt)}`);
  if (opts.year !== false) parts.push(String(year));
  return parts.join(" ");
}

export function formatShortDate(value: ISODate): string {
  const { month, day } = parseISODate(value);
  return `${day} ${monthName(month)}`;
}

export function formatMonthYear(value: ISODate, alt = false): string {
  const { year, month } = parseISODate(value);
  return `${monthName(month, alt)} ${year}`;
}

/** Month range for planting windows, e.g. "أيلول – تشرين الثاني". */
export function formatMonthRange(start: number, end: number): string {
  if (start === end) return monthName(start);
  return `${monthName(start)} – ${monthName(end)}`;
}

/** Arabic plural forms for "day". */
export function formatDays(n: number): string {
  const v = Math.abs(n);
  if (v === 0) return "اليوم";
  if (v === 1) return "يوم واحد";
  if (v === 2) return "يومان";
  if (v >= 3 && v <= 10) return `${formatNumber(v)} أيام`;
  return `${formatNumber(v)} يومًا`;
}

/** Human relative phrasing for a due date compared with today. */
export function relativeDay(diff: number): string {
  if (diff === 0) return "اليوم";
  if (diff === 1) return "غدًا";
  if (diff === -1) return "أمس";
  if (diff === 2) return "بعد غد";
  if (diff > 0) return `بعد ${formatDays(diff)}`;
  return `منذ ${formatDays(diff)}`;
}

export function formatDateTime(iso: string, timeZone: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const date = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const time = new Intl.DateTimeFormat(NUMBER_LOCALE, { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
  return `${formatDate(date, { year: true })}، الساعة ${time}`;
}

export function greetingFor(hour: number): string {
  if (hour < 12) return "صباح الخير";
  return "مساء الخير";
}
