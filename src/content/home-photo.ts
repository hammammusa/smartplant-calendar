/**
 * Optional real photograph for the home page hero (see docs/HOME_PHOTO.md).
 *
 * Leave it `null` to show the bundled vector landscape. To use a real photo:
 *   1. npm run images:home -- path/to/photo.jpg
 *      (writes optimised WebP files to public/images/home/)
 *   2. Paste the object the script prints here and write an Arabic `alt`
 *      describing the photo, plus the photographer/licence in `credit`.
 * Only use photos you own or that are licensed for this use.
 */
export interface HomePhoto {
  /** Path under /public, e.g. "/images/home/hero-1200.webp". */
  src: string;
  srcSet: { src: string; width: number }[];
  width: number;
  height: number;
  /** Arabic description of the photo. */
  alt: string;
  /** Arabic credit line, e.g. «تصوير: …». */
  credit?: string;
}

export const HOME_PHOTO: HomePhoto | null = null;
