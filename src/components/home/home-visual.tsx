import { HOME_PHOTO } from "@/content/home-photo";
import { BASE_PATH } from "@/lib/env";
import { cn } from "@/lib/utils";
import { TerracesArt } from "./terraces-art";

/**
 * Hero picture. Uses the real photograph configured in `src/content/home-photo.ts`
 * (see docs/HOME_PHOTO.md) and falls back to the bundled vector landscape.
 */
export function HomeVisual({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-[1.75rem] border border-border bg-surface-muted shadow-md", className)}>
      {HOME_PHOTO ? (
        // eslint-disable-next-line @next/next/no-img-element -- static export: plain responsive <img> with pre-sized WebP files
        <img
          src={`${BASE_PATH}${HOME_PHOTO.src}`}
          srcSet={HOME_PHOTO.srcSet.map((s) => `${BASE_PATH}${s.src} ${s.width}w`).join(", ")}
          sizes="(min-width: 1024px) 40vw, 100vw"
          width={HOME_PHOTO.width}
          height={HOME_PHOTO.height}
          alt={HOME_PHOTO.alt}
          decoding="async"
          fetchPriority="high"
          className="h-full w-full object-cover"
        />
      ) : (
        <TerracesArt />
      )}
      {HOME_PHOTO?.credit ? (
        <p className="absolute bottom-2 start-2 rounded-md bg-black/45 px-2 py-0.5 text-xs text-white">{HOME_PHOTO.credit}</p>
      ) : null}
    </div>
  );
}
