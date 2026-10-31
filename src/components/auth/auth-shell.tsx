import Link from "next/link";
import { CropArt } from "@/components/brand/crop-art";
import { Logo } from "@/components/brand/logo";
import { Alert } from "@/components/ui/feedback";
import { isSupabaseConfigured } from "@/lib/env";

export function AuthShell({ title, description, children, footer }: { title: string; description?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="container-page grid flex-1 grid-cols-1 items-center gap-10 py-10 lg:grid-cols-2">
      <div className="mx-auto w-full max-w-md">
        <Link href="/" className="mb-8 inline-block lg:hidden" aria-label="الصفحة الرئيسية">
          <Logo />
        </Link>
        <h1 className="text-3xl font-extrabold">{title}</h1>
        {description ? <p className="mt-2 text-muted-foreground">{description}</p> : null}
        <div className="mt-8">
          {isSupabaseConfigured ? (
            children
          ) : (
            <Alert tone="warning" title="الحسابات غير مفعّلة في وضع المعاينة">
              لم تتم تهيئة قاعدة البيانات (Supabase) لهذه النسخة بعد، لذلك لا يمكن إنشاء حساب أو تسجيل الدخول. يمكنك استخدام مولّد الخطط والرزنامة الآن، وتُحفظ بياناتك في هذا المتصفح.{" "}
              <Link href="/planner" className="font-semibold text-brand-700 underline">ابدأ خطة دون حساب</Link>
            </Alert>
          )}
        </div>
        {footer && isSupabaseConfigured ? <div className="mt-6 text-sm text-muted-foreground">{footer}</div> : null}
      </div>
      <div className="relative hidden h-full min-h-[34rem] overflow-hidden rounded-3xl lg:block" aria-hidden>
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-3 p-3">
          {["lettuce", "tomato", "olive", "strawberry"].map((s) => (
            <div key={s} className="overflow-hidden rounded-2xl">
              <CropArt slug={s} />
            </div>
          ))}
        </div>
        <div className="absolute inset-x-6 bottom-6 rounded-2xl bg-surface/90 p-5 shadow-lg backdrop-blur">
          <p className="font-bold">خططك ومهامك محفوظة بأمان</p>
          <p className="text-sm text-muted-foreground">بيانات كل مستخدم معزولة على مستوى قاعدة البيانات، ولا يستطيع أحد غيرك رؤيتها.</p>
        </div>
      </div>
    </div>
  );
}
