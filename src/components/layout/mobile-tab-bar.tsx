"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isActive, MOBILE_TABS } from "./nav-items";

/** Bottom navigation for phones. Hidden on auth and admin screens. */
export function MobileTabBar() {
  const pathname = usePathname();
  if (pathname.startsWith("/auth") || pathname.startsWith("/admin")) return null;
  return (
    <nav
      aria-label="التنقل السريع"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-5">
        {MOBILE_TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          const Icon = tab.icon;
          const primary = tab.href === "/planner";
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-0.5 text-[0.7rem] font-semibold text-subtle-foreground",
                  active && "text-brand-700",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full transition-colors",
                    active && !primary && "bg-accent",
                    primary && "size-10 -mt-3 bg-primary text-primary-foreground shadow-md",
                  )}
                >
                  <Icon className={cn("size-5", primary && "size-5")} />
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
