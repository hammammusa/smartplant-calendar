import Image from "next/image";
import type { Crop } from "@/domain/types";
import { cn } from "@/lib/utils";
import { CropArt } from "./crop-art";

/** Admin-uploaded photo when available, otherwise the bundled illustration. */
export function CropImage({
  crop,
  className,
  sizes = "(max-width: 640px) 100vw, 33vw",
  priority,
}: {
  crop: Pick<Crop, "slug" | "name" | "imageUrl" | "imageAlt">;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-surface-muted", className)}>
      {crop.imageUrl ? (
        <Image
          src={crop.imageUrl}
          alt={crop.imageAlt || crop.name}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <CropArt slug={crop.slug} title={crop.imageAlt || `رسم توضيحي: ${crop.name}`} />
      )}
    </div>
  );
}
