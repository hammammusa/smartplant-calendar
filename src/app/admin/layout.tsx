import { Database, LayoutDashboard, ListTree, MapPinned, MessageCircleQuestion, Settings, Shield } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/feedback";
import { isSupabaseConfigured } from "@/lib/env";
import { requireAdmin } from "@/services/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: { default: "لوحة الإدارة", template: "%s | لوحة الإدارة" }, robots: { index: false } };

const NAV = [
  { href: "/admin", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/admin/crops", label: "المحاصيل والإرشادات", icon: ListTree },
  { href: "/admin/regions", label: "المدن والمناطق المناخية", icon: MapPinned },
  { href: "/admin/faqs", label: "الأسئلة الشائعة", icon: MessageCircleQuestion },
  { href: "/admin/settings", label: "الإعدادات العامة", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) {
    return (
      <div className="container-page py-12">
        <Alert tone="warning" title="لوحة الإدارة تتطلب تهيئة قاعدة البيانات">
          لوحة الإدارة تعمل فقط بعد ربط المنصة بمشروع Supabase وترقية حسابك إلى مشرف. راجع قسم «الإعداد» في ملف README.
        </Alert>
      </div>
    );
  }
  // Server-side authorisation: non-admins are redirected before anything renders.
  const admin = await requireAdmin();
  return (
    <div className="container-page grid grid-cols-1 gap-6 py-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-primary p-3 text-primary-foreground">
          <Shield className="size-5" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-bold">لوحة الإدارة</p>
            <p className="truncate text-xs text-primary-foreground/80" dir="ltr">{admin.email}</p>
          </div>
        </div>
        <nav aria-label="أقسام الإدارة" className="flex gap-1 overflow-x-auto scrollbar-none lg:flex-col">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-surface hover:text-foreground">
              <n.icon className="size-4" aria-hidden /> {n.label}
            </Link>
          ))}
        </nav>
        <p className="mt-4 hidden items-start gap-2 text-xs leading-6 text-subtle-foreground lg:flex">
          <Database className="mt-1 size-3.5 shrink-0" aria-hidden />
          كل التعديلات محمية على مستوى قاعدة البيانات، ولا تستطيع حسابات المستخدمين العاديين تنفيذها.
        </p>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
