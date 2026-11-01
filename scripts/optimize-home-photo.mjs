#!/usr/bin/env node
/**
 * Turns one photograph into small WebP files for the home page hero.
 *   npm run images:home -- path/to/photo.jpg
 * Writes public/images/home/hero-{640,1024,1600}.webp (metadata, incl. GPS, is stripped)
 * and prints the object to paste into src/content/home-photo.ts.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";

const input = process.argv[2];
if (!input) {
  console.error("Usage: npm run images:home -- path/to/photo.jpg");
  process.exit(1);
}

const { default: sharp } = await import("sharp");
const outDir = path.join(process.cwd(), "public", "images", "home");
await mkdir(outDir, { recursive: true });

const WIDTHS = [640, 1024, 1600];
const meta = await sharp(input).rotate().metadata();
const ratio = (meta.height ?? 3) / (meta.width ?? 4);
const srcSet = [];
for (const width of WIDTHS) {
  const file = `hero-${width}.webp`;
  // Without .withMetadata(), sharp drops EXIF (camera, GPS location) from the output.
  const info = await sharp(input).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 72, effort: 5 }).toFile(path.join(outDir, file));
  srcSet.push({ src: `/images/home/${file}`, width: info.width });
  console.error(`${file}: ${info.width}x${info.height}, ${Math.round(info.size / 1024)} KB`);
}

const main = srcSet[1] ?? srcSet[0];
console.log(
  JSON.stringify(
    { src: main.src, srcSet, width: main.width, height: Math.round(main.width * ratio), alt: "اكتب هنا وصفًا عربيًا للصورة", credit: "تصوير: …" },
    null,
    2,
  ),
);
