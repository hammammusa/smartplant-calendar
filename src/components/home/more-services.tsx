"use client";

import { BookOpenText, CloudSun, LayoutDashboard, ListChecks, ShieldCheck, Sprout, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useAppData } from "@/components/providers/app-data-provider";

interface Service {
  href: string;
  title: string;
  hint: string;
  icon: LucideIcon;
}

const BASE: Service[] = [
  { href: "/planner/", title: "خطة زراعية جديدة", hint: "مهام من التجهيز إلى الحصاد", icon: Sprout },
  { href: "/weather/", title: "الطقس", hint: "صقيع وحر وأمطار", icon: CloudSun },
  { href: "/crops/", title: "دليل المحاصيل", hint: "الزراعة والعناية والحصاد", icon: BookOpenText },
  { href: "/tasks/", title: "المهام", hint: "ري وتسميد ومتابعة", icon: ListChecks },
  { href: "/dashboard/", title: "لوحتي", hint: "خططي ومهام اليوم", icon: LayoutDashboard },
];

/** Compact links to every other part of the site. */
export function MoreServices() {
  const { mode, user, isAdmin } = useAppData();
  const signedIn = mode === "remote" && user;
  const items: Service[] = [
    ...BASE,
    signedIn
      ? { href: "/profile/", title: "حسابي", hint: "الملف والإعدادات", icon: UserRound }
      : { href: "/auth/login/", title: "حسابي", hint: "دخول أو حساب مجاني", icon: UserRound },
    ...(signedIn && isAdmin ? [{ href: "/admin/", title: "لوحة الإدارة", hint: "المحاصيل والمحتوى", icon: ShieldCheck }] : []),
  ];
  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6 lg:gap-3">
      {items.map((s) => (
        <li key={s.href} className="home-reveal">
          <Link
            href={s.href}
            className="group flex h-full min-h-24 flex-col gap-2 rounded-2xl border border-border bg-surface p-3.5 shadow-xs transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-brand-600/30 hover:shadow-md active:scale-[0.98]"
          >
            <s.icon className="size-6 text-brand-600 transition-transform duration-200 group-hover:scale-110" aria-hidden />
            <span className="text-base font-bold leading-6">{s.title}</span>
            <span className="text-sm leading-5 text-muted-foreground">{s.hint}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
