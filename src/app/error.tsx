"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="container-page flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-warning-soft text-warning">
        <TriangleAlert className="size-8" aria-hidden />
      </span>
      <h1 className="text-3xl font-extrabold">حدث خطأ غير متوقع</h1>
      <p className="max-w-md text-muted-foreground">نعتذر عن ذلك. حاول إعادة تحميل الصفحة، وإن تكررت المشكلة تحقق من اتصالك بالإنترنت.</p>
      <div className="flex gap-3">
        <Button onClick={reset}><RefreshCw /> إعادة المحاولة</Button>
        <Button asChild variant="outline"><Link href="/">الصفحة الرئيسية</Link></Button>
      </div>
    </div>
  );
}
