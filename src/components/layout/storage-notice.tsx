"use client";

import { HardDrive, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/feedback";
import { isSupabaseConfigured } from "@/lib/env";
import { formatNumber } from "@/lib/format";

/**
 * Honest banner explaining where the visitor's data lives:
 *   - preview mode (no database): browser only,
 *   - guest with database available: browser only + invite to sign up,
 *   - signed in with leftover guest data: offer to move it to the account.
 */
export function StorageNotice() {
  const { mode, localItemsToImport, importLocalData } = useAppData();
  const [busy, setBusy] = useState(false);

  if (mode === "loading") return null;

  if (mode === "remote") {
    if (localItemsToImport === 0) return null;
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-info/20 bg-info-soft p-4 text-sm sm:flex-row sm:items-center">
        <UploadCloud className="size-5 shrink-0 text-info" aria-hidden />
        <p className="flex-1 leading-7">
          لديك {formatNumber(localItemsToImport)} من الخطط أو المهام محفوظة في هذا المتصفح من قبل تسجيل الدخول. هل تريد نقلها إلى حسابك؟
        </p>
        <Button
          size="sm"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const res = await importLocalData();
            setBusy(false);
            if (res.ok) toast.success(`تم نقل ${formatNumber(res.data.plans)} خطة و${formatNumber(res.data.tasks)} مهمة إلى حسابك.`);
            else toast.error(res.error);
          }}
        >
          {busy ? <Spinner /> : null} نقل إلى حسابي
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-warning-border bg-warning-soft p-4 text-sm sm:flex-row sm:items-center">
      <HardDrive className="size-5 shrink-0 text-warning" aria-hidden />
      <p className="flex-1 leading-7 text-foreground/85">
        {isSupabaseConfigured ? (
          <>
            <strong className="font-bold">أنت تستخدم المنصة كضيف.</strong> تُحفظ خططك ومهامك في هذا المتصفح فقط، وقد تضيع عند مسح بيانات المتصفح.
          </>
        ) : (
          <>
            <strong className="font-bold">وضع المعاينة:</strong> قاعدة البيانات غير مهيأة بعد، لذلك الحسابات غير متاحة وتُحفظ بياناتك في هذا المتصفح فقط.
          </>
        )}
      </p>
      {isSupabaseConfigured ? (
        <Button asChild size="sm" variant="outline">
          <Link href="/auth/register">أنشئ حسابًا لحفظها</Link>
        </Button>
      ) : null}
    </div>
  );
}
