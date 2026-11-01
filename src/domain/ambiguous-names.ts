import { normalizeArabic } from "./crop-search";

/**
 * Common names that point to more than one crop. When a farmer searches for
 * one of them we show every meaning with a short, factual hint instead of
 * picking one silently. Every alias shared by two crops must be listed here
 * (a unit test enforces it).
 */
export interface AmbiguousName {
  name: string;
  options: { slug: string; hint: string }[];
}

export const AMBIGUOUS_NAMES: AmbiguousName[] = [
  {
    name: "الخوخ",
    options: [
      { slug: "peach", hint: "الدرّاق: ثمرة كبيرة قشرتها مخملية" },
      { slug: "plum", hint: "البرقوق: ثمرة أصغر قشرتها ملساء" },
    ],
  },
  {
    name: "البرسيم",
    options: [
      { slug: "berseem", hint: "البرسيم المصري: علف شتوي موسمي" },
      { slug: "alfalfa", hint: "البرسيم الحجازي (الفصّة): علف معمّر" },
    ],
  },
  {
    name: "الفستق",
    options: [
      { slug: "peanut", hint: "الفستق السوداني: نبات موسمي تتكوّن ثماره تحت التربة" },
      { slug: "pistachio", hint: "الفستق الحلبي: شجرة معمّرة" },
    ],
  },
];

/** The ambiguous name the query is (after normalisation), if any. */
export function ambiguityFor(query: string): AmbiguousName | undefined {
  const q = normalizeArabic(query);
  return q ? AMBIGUOUS_NAMES.find((a) => normalizeArabic(a.name) === q) : undefined;
}

/** Ambiguous names this crop carries, with the other crops they may mean. */
export function otherMeanings(slug: string): { name: string; others: { slug: string; hint: string }[] }[] {
  return AMBIGUOUS_NAMES.filter((a) => a.options.some((o) => o.slug === slug)).map((a) => ({
    name: a.name,
    others: a.options.filter((o) => o.slug !== slug),
  }));
}
