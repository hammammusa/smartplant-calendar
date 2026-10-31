"use client";

import { Database, LayoutDashboard, ListTree, LogIn, MapPinned, MessageCircleQuestion, Settings, Shield, ShieldX } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button } from "@/components/ui/button";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { Skeleton } from "@/components/ui/skeleton";
import { isSupabaseConfigured } from "@/lib/env";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/admin/crops", label: "المحاصيل والإرشادات", icon: ListTree },
  { href: "/admin/regions", label: "المدن والمناطق المناخية", icon: MapPinned },
  { href: "/admin/faqs", label: "الأسئلة الشائعة", icon: MessageCircleQuestion },
  { href: "/admin/settings", label: "الإعدادات العامة", icon: Settings },
];

/**
 * Client-side gate for the admin area. It only decides what to *show*:
 * every admin read/write is authorised by PostgreSQL RLS (is_admin()), so a
 * non-admin who bypasses this screen still cannot read private data or write.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { mode, user, isAdmin } = useAppData();
  const pathname = usePathname();

  if (!isSupabaseConfigured) {
    return (
      <div className="container-page py-12">
        <Alert tone="warning" title="لوحة الإدارة تتطلب تهيئة قاعدة البيانات">
          لوحة الإدارة تعمل فقط بعد ربط المنصة بمشروع Supabase وترقية حسابك إلى مشرف. راجع قسم «الإعداد» في ملف التوثيق المرفق مع المشروع.
        </Alert>
      </div>
    );
  }
  if (mode === "loading") {
    return (
      <div role="status" aria-label="جارٍ التحقق من الصلاحيات" className="container-page py-12">
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }
  if (!user) {
    return (
      <div className="container-page py-12">
        <EmptyState
          icon={LogIn}
          title="سجّل الدخول للوصول إلى لوحة الإدارة"
          action={<Button asChild><Link href={`/auth/login?next=${encodeURIComponent(pathname)}`}>تسجيل الدخول</Link></Button>}
        />
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="container-page py-12">
        <EmptyState icon={ShieldX} title="لا تملك صلاحية الوصول إلى لوحة الإدارة" description="هذه الصفحات متاحة لمشرفي المنصة فقط." />
      </div>
    );
  }

  return (
    <div className="container-page grid grid-cols-1 gap-6 py-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-primary p-3 text-primary-foreground">
          <Shield className="size-5" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-bold">لوحة الإدارة</p>
            <p className="truncate text-xs text-primary-foreground/80" dir="ltr">{user.email}</p>
          </div>
        </div>
        <nav aria-label="أقسام الإدارة" className="flex gap-1 overflow-x-auto scrollbar-none lg:flex-col">
          {NAV.map((n) => {
            const active = n.href === "/admin" ? pathname.replace(/\/$/, "") === "/admin" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-surface hover:text-foreground",
                  active && "bg-surface text-brand-700 shadow-xs",
                )}
              >
                <n.icon className="size-4" aria-hidden /> {n.label}
              </Link>
            );
          })}
        </nav>
        <p className="mt-4 hidden items-start gap-2 text-xs leading-6 text-subtle-foreground lg:flex">
          <Database className="mt-1 size-3.5 shrink-0" aria-hidden />
          كل التعديلات محمية على مستوى قاعدة البيانات، ولا تستطيع حسابات المستخدمين العاديين تنفيذها. تظهر تعديلات المحتوى في الصفحات العامة بعد إعادة بناء الموقع.
        </p>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Small helper for admin pages that load data in the browser. */
export function AdminLoading() {
  return (
    <div role="status" aria-label="جارٍ التحميل" className="space-y-3">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}
