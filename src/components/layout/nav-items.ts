import {
  BookOpenText,
  CalendarDays,
  CloudSun,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Sprout,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const MAIN_NAV: NavItem[] = [
  { href: "/crops", label: "دليل المحاصيل", icon: BookOpenText },
  { href: "/recommendations", label: "ماذا أزرع الآن؟", icon: Lightbulb },
  { href: "/planner", label: "خطة زراعية", icon: Sprout },
  { href: "/calendar", label: "الرزنامة", icon: CalendarDays },
  { href: "/tasks", label: "المهام", icon: ListChecks },
  { href: "/weather", label: "الطقس", icon: CloudSun },
];

export const MOBILE_TABS: NavItem[] = [
  { href: "/dashboard", label: "لوحتي", icon: LayoutDashboard },
  { href: "/calendar", label: "الرزنامة", icon: CalendarDays },
  { href: "/planner", label: "خطة جديدة", icon: Sprout },
  { href: "/tasks", label: "المهام", icon: ListChecks },
  { href: "/crops", label: "المحاصيل", icon: BookOpenText },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
