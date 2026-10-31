import { CloudSun, Droplets, Sprout, Wheat } from "lucide-react";
import { CropArt } from "@/components/brand/crop-art";
import { WEEKDAYS_SHORT } from "@/lib/format";

/**
 * Decorative composition for the hero: a stylised calendar card with crop
 * illustrations. It is explicitly an illustration ("مثال توضيحي"), not user data.
 */
export function HeroVisual() {
  const marks: Record<number, string> = {
    3: "bg-[var(--task-soil)]",
    6: "bg-[var(--task-planting)]",
    8: "bg-[var(--task-irrigation)]",
    11: "bg-[var(--task-irrigation)]",
    14: "bg-[var(--task-fertilizing)]",
    17: "bg-[var(--task-irrigation)]",
    20: "bg-[var(--task-pest)]",
    23: "bg-[var(--task-irrigation)]",
    27: "bg-[var(--task-harvest)]",
  };
  const order = [6, 0, 1, 2, 3, 4, 5];
  return (
    <div className="relative mx-auto w-full max-w-[34rem]" aria-hidden>
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand-100 via-white to-lime-500/20 blur-2xl" />
      <div className="grid grid-cols-6 gap-3">
        <div className="col-span-4 rounded-2xl border border-border bg-surface p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-subtle-foreground">مثال توضيحي</p>
              <p className="font-bold">نيسان</p>
            </div>
            <span className="rounded-full bg-accent px-2.5 py-1 text-[0.7rem] font-bold text-accent-foreground">البندورة</span>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[0.65rem]">
            {order.map((d) => (
              <span key={d} className="pb-1 font-semibold text-subtle-foreground">
                {WEEKDAYS_SHORT[d].slice(0, 2)}
              </span>
            ))}
            {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
              <span
                key={day}
                className={`flex h-8 flex-col items-center justify-center rounded-md text-xs ${day === 6 ? "bg-primary font-bold text-white" : "text-foreground"}`}
              >
                {day}
                {marks[day] && day !== 6 ? <span className={`mt-0.5 size-1.5 rounded-full ${marks[day]}`} /> : null}
              </span>
            ))}
          </div>
        </div>
        <div className="col-span-2 flex flex-col gap-3">
          <div className="overflow-hidden rounded-2xl border border-border shadow-md">
            <CropArt slug="tomato" className="aspect-square" />
          </div>
          <div className="rounded-2xl border border-border bg-surface p-3 shadow-md">
            <CloudSun className="size-6 text-lime-600" />
            <p className="mt-1 text-lg font-extrabold">22°</p>
            <p className="text-[0.7rem] text-subtle-foreground">طقس منطقتك</p>
          </div>
        </div>
        <div className="col-span-3 flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-md">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--task-irrigation-soft)] text-[var(--task-irrigation)]">
            <Droplets className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">متابعة الري</p>
            <p className="text-[0.7rem] text-subtle-foreground">افحص رطوبة التربة أولًا</p>
          </div>
        </div>
        <div className="col-span-3 flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 shadow-md">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[var(--task-harvest-soft)] text-[var(--task-harvest)]">
            <Wheat className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">الحصاد المتوقع</p>
            <p className="text-[0.7rem] text-subtle-foreground">بعد 60–90 يومًا تقريبًا</p>
          </div>
        </div>
        <div className="col-span-6 flex items-center gap-3 rounded-2xl bg-primary p-4 text-primary-foreground shadow-lg">
          <Sprout className="size-6 shrink-0 text-lime-500" />
          <p className="text-sm font-semibold">خطة مبنية على تاريخ زراعتك ومنطقتك المناخية، وقابلة للتعديل في أي وقت.</p>
        </div>
      </div>
    </div>
  );
}
