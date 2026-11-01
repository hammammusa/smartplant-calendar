"use client";

import { ArrowLeft, CalendarDays, Lightbulb, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { useAppData } from "@/components/providers/app-data-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CropSearch, type SearchCrop } from "./crop-search";

/** Saved village/area with a "change" link; never asks again once saved. */
function LocationChip() {
  const { location, mode } = useAppData();
  if (mode === "loading") return <Skeleton className="h-10 w-56 rounded-full" />;
  if (!location) {
    return (
      <Link
        href="/location/"
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-dashed border-brand-600/40 bg-surface/90 px-4 py-1.5 text-sm font-bold text-brand-700 shadow-xs transition-colors hover:bg-accent"
      >
        <MapPin className="size-4" aria-hidden />
        حدّد قريتك لنعرض مواعيد منطقتك
      </Link>
    );
  }
  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-surface/90 py-1 ps-3 pe-1 shadow-xs">
      <MapPin className="size-4 shrink-0 text-brand-600" aria-hidden />
      <p className="min-w-0 truncate text-sm">
        <span className="text-muted-foreground">منطقتك: </span>
        <strong className="font-bold" data-testid="home-location-label">{location.label}</strong>
      </p>
      <Link
        href="/location/"
        aria-label={`تغيير المنطقة (الحالية: ${location.label})`}
        className="inline-flex h-8 shrink-0 items-center rounded-full bg-accent px-3 text-sm font-bold text-accent-foreground transition-colors hover:bg-brand-100"
      >
        تغيير
      </Link>
    </div>
  );
}

const ACTION_CLASS =
  "group flex h-full min-h-[3.75rem] w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-start shadow-xs transition-[transform,box-shadow,background-color,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] sm:min-h-24 sm:flex-col sm:items-start sm:p-4";

function ActionIcon({ icon: Icon, primary }: { icon: typeof Search; primary?: boolean }) {
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl sm:size-11 transition-transform duration-200 group-hover:scale-105",
        primary ? "bg-white/15 text-white" : "bg-accent text-accent-foreground",
      )}
    >
      <Icon className="size-6" aria-hidden />
    </span>
  );
}

function ActionText({ title, hint, primary }: { title: string; hint: string; primary?: boolean }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block text-base font-extrabold leading-6 lg:text-lg">{title}</span>
      <span className={cn("block text-sm leading-5", primary ? "text-white/85" : "text-muted-foreground")}>{hint}</span>
    </span>
  );
}

export function HomeHero({ crops, quick }: { crops: SearchCrop[]; quick: { slug: string; name: string }[] }) {
  const searchRef = useRef<HTMLInputElement>(null);

  const focusSearch = () => {
    const input = searchRef.current;
    if (!input) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    input.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    input.focus({ preventScroll: true });
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="home-enter" style={{ animationDelay: "0ms" }}>
        <LocationChip />
      </div>

      <div className="home-enter space-y-1.5" style={{ animationDelay: "60ms" }}>
        <h1 className="text-[2rem] font-extrabold leading-tight text-foreground sm:text-5xl">
          شو بدك تزرع <span className="text-brand-600">اليوم؟</span>
        </h1>
        <p className="text-base text-muted-foreground sm:text-lg">اكتب اسم المحصول، ونقول لك متى تزرعه في منطقتك.</p>
      </div>

      <div className="home-enter relative z-20" style={{ animationDelay: "120ms" }}>
        <CropSearch ref={searchRef} crops={crops} />
        <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" aria-label="محاصيل للتجربة">
          <span className="shrink-0 text-sm font-semibold text-muted-foreground">جرّب:</span>
          {quick.map((c) => (
            <Link
              key={c.slug}
              href={`/crops/${c.slug}/`}
              className="inline-flex h-9 shrink-0 items-center rounded-full border border-border bg-surface px-3.5 text-sm font-bold text-foreground transition-[background-color,border-color,transform] duration-150 hover:border-brand-600/40 hover:bg-accent active:scale-95"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      <nav aria-label="الإجراءات الرئيسية" className="home-enter" style={{ animationDelay: "180ms" }}>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
          <li>
            <Link href="/recommendations/" className={cn(ACTION_CLASS, "border-transparent bg-primary text-primary-foreground hover:bg-primary-hover")}>
              <ActionIcon icon={Lightbulb} primary />
              <ActionText title="ماذا أزرع الآن؟" hint="المناسب لمنطقتك هذا الشهر" primary />
              <ArrowLeft className="size-5 shrink-0 opacity-80 sm:hidden" aria-hidden />
            </Link>
          </li>
          <li>
            <button type="button" onClick={focusSearch} className={cn(ACTION_CLASS, "border-border bg-surface hover:border-brand-600/30")}>
              <ActionIcon icon={Search} />
              <ActionText title="ابحث عن موعد زراعة محصول" hint="اكتب الاسم في مربع البحث" />
              <ArrowLeft className="size-5 shrink-0 text-subtle-foreground sm:hidden" aria-hidden />
            </button>
          </li>
          <li>
            <Link href="/calendar/" className={cn(ACTION_CLASS, "border-border bg-surface hover:border-brand-600/30")}>
              <ActionIcon icon={CalendarDays} />
              <ActionText title="رزنامتي الزراعية" hint="مهامك من الزراعة للحصاد" />
              <ArrowLeft className="size-5 shrink-0 text-subtle-foreground sm:hidden" aria-hidden />
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
