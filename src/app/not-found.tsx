import { Sprout } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Sprout className="size-8" aria-hidden />
      </span>
      <h1 className="text-3xl font-extrabold">الصفحة غير موجودة</h1>
      <p className="max-w-md text-muted-foreground">ربما نُقلت الصفحة أو أن الرابط غير صحيح. يمكنك العودة إلى الصفحة الرئيسية أو تصفح دليل المحاصيل.</p>
      <div className="flex gap-3">
        <Button asChild><Link href="/">الصفحة الرئيسية</Link></Button>
        <Button asChild variant="outline"><Link href="/crops">دليل المحاصيل</Link></Button>
      </div>
    </div>
  );
}
