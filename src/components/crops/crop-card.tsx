import { Clock3, Droplets, Sun } from "lucide-react";
import Link from "next/link";
import { CropImage } from "@/components/brand/crop-image";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS, DIFFICULTY_LABELS, SUN_LABELS, WATER_LABELS } from "@/domain/labels";
import type { Crop } from "@/domain/types";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export function growthLabel(crop: Pick<Crop, "growthDaysMin" | "growthDaysMax" | "lifeCycle">): string {
  if (crop.growthDaysMin == null || crop.growthDaysMax == null) return crop.lifeCycle === "perennial" ? "معمّر — يختلف" : "غير محدد";
  return `${formatNumber(crop.growthDaysMin)}–${formatNumber(crop.growthDaysMax)} يومًا تقريبًا`;
}

const difficultyVariant = { easy: "default", medium: "info", hard: "warning" } as const;

export function CropCard({ crop, seasonText, className }: { crop: Crop; seasonText?: string; className?: string }) {
  return (
    <Link
      href={`/crops/${crop.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md",
        className,
      )}
    >
      <CropImage crop={crop} className="aspect-[5/3.4]" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold group-hover:text-brand-700">{crop.name}</h3>
            <p className="text-xs text-subtle-foreground">{CATEGORY_LABELS[crop.category]}</p>
          </div>
          <Badge variant={difficultyVariant[crop.difficulty]}>{DIFFICULTY_LABELS[crop.difficulty]}</Badge>
        </div>
        {seasonText ? <p className="text-sm font-semibold text-brand-700">{seasonText}</p> : null}
        <dl className="mt-auto grid grid-cols-1 gap-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sun className="size-4 text-lime-600" aria-hidden />
            <dt className="sr-only">الشمس</dt>
            <dd>{SUN_LABELS[crop.sun]}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="size-4 text-[var(--task-irrigation)]" aria-hidden />
            <dt className="sr-only">احتياج الري</dt>
            <dd>احتياج ري {WATER_LABELS[crop.water]}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Clock3 className="size-4 text-subtle-foreground" aria-hidden />
            <dt className="sr-only">مدة النمو</dt>
            <dd>{growthLabel(crop)}</dd>
          </div>
        </dl>
      </div>
    </Link>
  );
}
