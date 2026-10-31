"use client";

import { LayoutDashboard, LogIn, LogOut, Menu, Shield, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { isSupabaseConfigured } from "@/lib/env";
import { cn } from "@/lib/utils";
import { isActive, MAIN_NAV } from "./nav-items";
import { NotificationsBell } from "./notifications-bell";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { mode, user, isAdmin, signOut } = useAppData();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center gap-4">
        <Link href="/" className="shrink-0 rounded-lg" aria-label="رزنامة الزراعة الذكية — الصفحة الرئيسية">
          <Logo />
        </Link>

        <nav aria-label="التنقل الرئيسي" className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {MAIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-2 text-[0.92rem] font-semibold text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground",
                isActive(pathname, item.href) && "bg-accent text-accent-foreground hover:bg-accent",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-1.5 lg:ms-0">
          <NotificationsBell />
          {mode === "remote" && user ? (
            <div className="hidden items-center gap-1.5 md:flex">
              {isAdmin ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin">
                    <Shield /> الإدارة
                  </Link>
                </Button>
              ) : null}
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">
                  <LayoutDashboard /> لوحتي
                </Link>
              </Button>
              <Button asChild variant="ghost" size="icon" aria-label="الملف الشخصي">
                <Link href="/profile">
                  <UserRound />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="hidden items-center gap-1.5 md:flex">
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">لوحتي</Link>
              </Button>
              {isSupabaseConfigured ? (
                <>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/auth/login">تسجيل الدخول</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/auth/register">إنشاء حساب</Link>
                  </Button>
                </>
              ) : (
                <Button asChild size="sm">
                  <Link href="/planner">ابدأ خطتك</Link>
                </Button>
              )}
            </div>
          )}

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="فتح القائمة">
                <Menu className="size-6" />
              </Button>
            </DialogTrigger>
            <DialogContent side="end" aria-describedby={undefined}>
              <div className="border-b border-border p-5">
                <DialogTitle className="sr-only">القائمة</DialogTitle>
                <Logo />
              </div>
              <nav aria-label="القائمة" className="flex flex-col gap-1 p-3">
                {[{ href: "/", label: "الرئيسية", icon: null }, { href: "/dashboard", label: "لوحتي", icon: LayoutDashboard }, ...MAIN_NAV].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive(pathname, item.href) ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-3 font-semibold text-foreground hover:bg-surface-muted",
                        isActive(pathname, item.href) && "bg-accent text-accent-foreground",
                      )}
                    >
                      {Icon ? <Icon className="size-5 text-brand-600" /> : <span className="size-5" />}
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
                {mode === "remote" && user ? (
                  <>
                    {isAdmin ? (
                      <Button asChild variant="outline" onClick={() => setOpen(false)}>
                        <Link href="/admin">
                          <Shield /> لوحة الإدارة
                        </Link>
                      </Button>
                    ) : null}
                    <Button asChild variant="outline" onClick={() => setOpen(false)}>
                      <Link href="/profile">
                        <UserRound /> الملف الشخصي
                      </Link>
                    </Button>
                    <Button variant="danger-ghost" onClick={handleSignOut}>
                      <LogOut /> تسجيل الخروج
                    </Button>
                  </>
                ) : isSupabaseConfigured ? (
                  <>
                    <Button asChild onClick={() => setOpen(false)}>
                      <Link href="/auth/register">إنشاء حساب مجاني</Link>
                    </Button>
                    <Button asChild variant="outline" onClick={() => setOpen(false)}>
                      <Link href="/auth/login">
                        <LogIn /> تسجيل الدخول
                      </Link>
                    </Button>
                  </>
                ) : (
                  <p className="text-xs leading-6 text-muted-foreground">
                    الحسابات غير مفعّلة في وضع المعاينة. تُحفظ خططك في هذا المتصفح فقط.
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
