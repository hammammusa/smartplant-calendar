import { ArrowLeft, CalendarRange, Clock3, Droplets, ExternalLink, Home, Info, Sprout, Sun } from "lucide-react";
import { absoluteUrl } from "@/lib/env";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CropImage } from "@/components/brand/crop-image";
import { growthLabel } from "@/components/crops/crop-card";
import { PlantingStatus } from "@/components/crops/planting-status";
import { findSource, sourcesForCrop } from "@/data/crop-sources";
import { otherMeanings } from "@/domain/ambiguous-names";
import { isPlannable } from "@/domain/crop-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import {
  CATEGORY_LABELS,
  CLIMATE_ZONE_LABELS,
  COUNTRY_LABELS,
  DATA_STATUS_LABELS,
  DIFFICULTY_LABELS,
  GUIDE_SECTION_LABELS,
  LIFE_CYCLE_LABELS,
  METHOD_LABELS,
  SPACE_TYPE_LABELS,
  SUN_LABELS,
  WATER_LABELS,
} from "@/domain/labels";
import { CLIMATE_ZONES } from "@/domain/types";
import { formatMonthRange } from "@/lib/format";
import { getCropBySlug, getCrops } from "@/services/crops";


// Static export: only crops known at build time get pages (rebuild to add new ones).
export const dynamicParams = false;

export async function generateStaticParams() {
  const { crops } = await getCrops();
  return crops.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const crop = await getCropBySlug(slug);
  if (!crop) return { title: "المحصول غير موجود" };
  return {
    title: `زراعة ${crop.name}: المواعيد والعناية والحصاد`,
    description:
      crop.dataStatus === "incomplete"
        ? `${crop.name}: أسماؤه الأخرى وتصنيفه. مواعيد زراعته في فلسطين غير موثّقة بعد.`
        : `${crop.summary} مواعيد زراعة ${crop.name} حسب المنطقة المناخية، واحتياجات الري والشمس، والمشكلات الشائعة.`,
    alternates: { canonical: absoluteUrl(`/crops/${crop.slug}`) },
    // Thin, name-only pages stay out of search results until they are documented.
    ...(crop.dataStatus === "incomplete" ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CropDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const crop = await getCropBySlug(slug);
  if (!crop) notFound();

  const plannable = isPlannable(crop);
  const usedSources = [...new Set(crop.windows.map((w) => w.sourceId).filter((id): id is string => Boolean(id)))]
    .map((id) => findSource(id))
    .filter((src) => src !== undefined);
  const references = sourcesForCrop(crop.slug).filter((r) => r.status === "to_review");
  const notDocumented = "غير موثّق بعد";
  const facts: { icon: typeof Sun; label: string; value: string; note?: string }[] = [
    { icon: Sprout, label: "طرق الزراعة الشائعة", value: crop.propagation?.length ? crop.propagation.map((m) => METHOD_LABELS[m]).join("، ") : notDocumented },
    { icon: Sun, label: "الشمس", value: crop.sun ? SUN_LABELS[crop.sun] : notDocumented },
    { icon: Droplets, label: "الري", value: crop.wateringSummary || (crop.water ? `احتياج ${WATER_LABELS[crop.water]}` : notDocumented) },
    { icon: Clock3, label: "مدة النمو التقريبية", value: crop.dataStatus === "incomplete" && crop.growthDaysMin == null ? notDocumented : growthLabel(crop), note: crop.growthNote },
    { icon: Home, label: "المساحات المناسبة", value: crop.spaceTypes.length ? crop.spaceTypes.map((s) => SPACE_TYPE_LABELS[s]).join("، ") : notDocumented },
  ];

  return (
    <article className="container-page py-8 sm:py-12">
      <nav aria-label="مسار التنقل" className="mb-6 text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-brand-700">الرئيسية</Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/crops" className="hover:text-brand-700">دليل المحاصيل</Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="font-semibold text-foreground">{crop.name}</li>
        </ol>
      </nav>

      <header className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge>{CATEGORY_LABELS[crop.category]}</Badge>
            <Badge variant="outline">{LIFE_CYCLE_LABELS[crop.lifeCycle]}</Badge>
            {crop.difficulty ? <Badge variant="info">صعوبة: {DIFFICULTY_LABELS[crop.difficulty]}</Badge> : null}
            <Badge variant={crop.dataStatus === "reviewed" ? "solid" : "warning"}>{DATA_STATUS_LABELS[crop.dataStatus]}</Badge>
          </div>
          <div>
            <h1 className="text-4xl font-extrabold">{crop.name}</h1>
            <p className="mt-1 text-sm text-subtle-foreground">
              {crop.otherNames?.length ? `يُعرف أيضًا باسم: ${crop.otherNames.join("، ")}` : null}
              {crop.scientificName ? (
                <>
                  {crop.otherNames?.length ? " · " : ""}
                  <span dir="ltr" className="italic">{crop.scientificName}</span>
                </>
              ) : null}
            </p>
          </div>
          <p className="text-lg leading-8 text-muted-foreground">{crop.summary}</p>
          {otherMeanings(crop.slug).map((m) => (
            <p key={m.name} className="rounded-xl bg-info-soft px-4 py-2.5 text-sm text-info" data-testid="other-meaning">
              اسم «{m.name}» يُطلق أيضًا على:{" "}
              {m.others.map((o, i) => (
                <span key={o.slug}>
                  {i ? "، " : ""}
                  <Link href={`/crops/${o.slug}`} className="font-bold underline underline-offset-4">{o.hint.split(":")[0]}</Link>
                </span>
              ))}
            </p>
          ))}
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
            <p className="mb-2 text-sm font-bold text-muted-foreground">موعده في منطقتك</p>
            <PlantingStatus crop={crop} />
          </div>
          <div className="flex flex-wrap gap-3">
            {plannable ? (
              <Button asChild size="lg">
                <Link href={`/planner?crop=${crop.slug}`}>
                  أنشئ خطة زراعة {crop.name} <ArrowLeft />
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" size="lg">
              <a href="#windows">مواعيد الزراعة</a>
            </Button>
          </div>
          {plannable ? null : (
            <p className="text-sm text-muted-foreground">لا يمكن إنشاء خطة لهذا المحصول بعد، لأن مواعيد زراعته غير موثّقة.</p>
          )}
        </div>
        <CropImage crop={crop} priority sizes="(max-width: 1024px) 100vw, 45vw" className="aspect-[4/3] rounded-2xl border border-border shadow-md" />
      </header>

      <section aria-label="معلومات سريعة" className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map((f) => (
          <div key={f.label} className="rounded-xl border border-border bg-surface p-4 shadow-xs">
            <f.icon className="mb-2 size-5 text-brand-600" aria-hidden />
            <p className="text-xs font-semibold text-subtle-foreground">{f.label}</p>
            <p className="mt-1 font-semibold leading-7">{f.value}</p>
            {f.note ? <p className="mt-1 text-xs leading-6 text-muted-foreground">{f.note}</p> : null}
          </div>
        ))}
      </section>

      <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-12">
          <section id="windows" aria-labelledby="windows-title" className="scroll-mt-24">
            <h2 id="windows-title" className="mb-2 flex items-center gap-2 text-2xl font-extrabold">
              <CalendarRange className="size-6 text-brand-600" aria-hidden /> مواعيد الزراعة حسب المنطقة
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              تقديرات أولية عامة. الأشهر بالتقويم الميلادي بأسمائها الشامية. «بذر في المشتل» موعد مختلف عن «نقل الأشتال إلى الأرض».
            </p>
            {crop.windows.length === 0 ? (
              <Alert tone="info" title="لا توجد معلومات موثوقة كافية">
                لم نوثّق بعد مواعيد زراعة {crop.name} في أي منطقة من مناطق فلسطين، ولن نعرض موعدًا تقديريًا دون مصدر. اسأل الإرشاد الزراعي في منطقتك.
              </Alert>
            ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-surface">
              <table className="w-full min-w-[32rem] text-start text-sm">
                <caption className="sr-only">مواعيد زراعة {crop.name} حسب المنطقة المناخية</caption>
                <thead className="bg-surface-muted text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-start font-semibold">المنطقة المناخية</th>
                    <th scope="col" className="px-4 py-3 text-start font-semibold">الفترة المقترحة</th>
                    <th scope="col" className="px-4 py-3 text-start font-semibold">الطريقة</th>
                    <th scope="col" className="px-4 py-3 text-start font-semibold">ملاحظة</th>
                    <th scope="col" className="px-4 py-3 text-start font-semibold">المصدر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[...(crop.windows.some((w) => w.zone === null) ? [null] : []), ...CLIMATE_ZONES].flatMap((zone) => {
                    const ws = crop.windows.filter((w) => w.zone === zone);
                    const generalLabel = `عام في ${COUNTRY_LABELS[ws[0]?.countryCode ?? ""] ?? "البلد"} (غير خاص بمنطقة)`;
                    if (zone === null && ws.length === 0) return [];
                    if (ws.length === 0)
                      return [
                        <tr key={zone}>
                          <th scope="row" className="px-4 py-3 text-start font-semibold">{zone ? CLIMATE_ZONE_LABELS[zone] : generalLabel}</th>
                          <td colSpan={4} className="px-4 py-3 text-subtle-foreground">لا تتوفر بيانات موثّقة لهذه المنطقة</td>
                        </tr>,
                      ];
                    return ws.map((w, i) => (
                      <tr key={`${zone ?? "general"}-${i}`} data-testid={zone ? undefined : "general-window"}>
                        {i === 0 ? (
                          <th scope="row" rowSpan={ws.length} className="px-4 py-3 text-start align-top font-semibold">
                            {zone ? CLIMATE_ZONE_LABELS[zone] : generalLabel}
                            {zone && w.countryCode ? (
                              <span className="block text-xs font-normal text-muted-foreground">في {COUNTRY_LABELS[w.countryCode] ?? w.countryCode}</span>
                            ) : null}
                          </th>
                        ) : null}
                        <td className="px-4 py-3 font-semibold text-brand-700">{formatMonthRange(w.startMonth, w.endMonth)}</td>
                        <td className="px-4 py-3">{METHOD_LABELS[w.method]}</td>
                        <td className="px-4 py-3 text-muted-foreground">{w.note ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground" data-testid="window-source">
                          {findSource(w.sourceId) ? (
                            <a href={findSource(w.sourceId)!.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline underline-offset-4">
                              {findSource(w.sourceId)!.publisher}
                            </a>
                          ) : (
                            "معرفة عامة أولية"
                          )}
                        </td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
            )}
          </section>

          {crop.guide.map((g) => (
            <section key={g.section} id={`guide-${g.section}`} aria-labelledby={`h-${g.section}`} className="scroll-mt-24">
              <h2 id={`h-${g.section}`} className="mb-3 text-2xl font-extrabold">{g.title || GUIDE_SECTION_LABELS[g.section]}</h2>
              <div className="space-y-3 leading-8 text-foreground/85">
                {g.body.split(/\n{2,}/).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          ))}

          <Alert tone="warning" title="مصدر المعلومات ودرجة الثقة">
            {crop.sourceNote}
          </Alert>

          {usedSources.length ? (
            <section aria-labelledby="used-title">
              <h2 id="used-title" className="mb-2 text-lg font-extrabold">المصادر</h2>
              <ul className="space-y-3 text-sm">
                {usedSources.map((r) => (
                  <li key={r.id}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1.5 font-semibold text-brand-700 underline-offset-4 hover:underline">
                      <ExternalLink className="mt-1 size-4 shrink-0" aria-hidden />
                      {r.title}
                    </a>
                    <span className="block text-muted-foreground">{r.publisher}</span>
                    {crop.windows
                      .filter((w) => w.sourceId === r.id && w.sourceDetail)
                      .map((w) => w.sourceDetail)
                      .filter((d, i, all) => all.indexOf(d) === i)
                      .map((d) => (
                        <p key={d} className="mt-1 border-s-4 border-border-strong ps-3 text-muted-foreground">{d}</p>
                      ))}
                    {r.readVia ? <span className="mt-1 block text-xs text-subtle-foreground">{r.readVia}</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {references.length ? (
            <section aria-labelledby="refs-title">
              <h2 id="refs-title" className="mb-2 text-lg font-extrabold">مراجع مرشّحة للمراجعة</h2>
              <p className="mb-3 text-sm text-muted-foreground">لم نأخذ منها أي موعد بعد؛ ندرجها ليراجعها مختص قبل اعتماد بياناتها.</p>
              <ul className="space-y-2 text-sm">
                {references.map((r) => (
                  <li key={r.id}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1.5 font-semibold text-brand-700 underline-offset-4 hover:underline">
                      <ExternalLink className="mt-1 size-4 shrink-0" aria-hidden />
                      {r.title}
                    </a>
                    <span className="block text-muted-foreground">{r.publisher} — {r.covers}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="hidden lg:block">
          <nav aria-label="محتويات الصفحة" className="sticky top-24 rounded-xl border border-border bg-surface p-4">
            <p className="mb-2 text-sm font-bold">في هذه الصفحة</p>
            <ul className="space-y-1 text-sm">
              <li>
                <a href="#windows" className="block rounded-md px-2 py-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground">مواعيد الزراعة</a>
              </li>
              {crop.guide.map((g) => (
                <li key={g.section}>
                  <a href={`#guide-${g.section}`} className="block rounded-md px-2 py-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground">
                    {g.title || GUIDE_SECTION_LABELS[g.section]}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-accent p-3 text-xs leading-6 text-accent-foreground">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              ستحصل على تنبيه إن كان تاريخ زراعتك خارج المواعيد المقترحة لمنطقتك.
            </div>
          </nav>
        </aside>
      </div>
    </article>
  );
}
