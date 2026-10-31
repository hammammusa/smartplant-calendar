import {
  ArrowLeft,
  BellRing,
  BookOpenText,
  CalendarCheck2,
  CalendarDays,
  CloudSun,
  Droplets,
  FlaskConical,
  MapPin,
  ShieldCheck,
  Smartphone,
  Snowflake,
  Sprout,
  ThermometerSun,
} from "lucide-react";
import Link from "next/link";
import { CropCard } from "@/components/crops/crop-card";
import { HeroVisual } from "@/components/home/hero-visual";
import { PlanPreview } from "@/components/home/plan-preview";
import { SeasonExplorer } from "@/components/home/season-explorer";
import { Button } from "@/components/ui/button";
import { SEASON_MONTHS } from "@/domain/labels";
import { SEASONS } from "@/domain/types";
import { monthOf, todayInTimeZone } from "@/lib/dates";
import { getFaqs } from "@/services/content";
import { getCrops } from "@/services/crops";

export const revalidate = 300;

const STEPS = [
  { icon: MapPin, title: "حدّد منطقتك ومساحتك", text: "اختر مدينتك ونوع مساحتك: حديقة أو سطح أو شرفة أو أصص أو أرض. نحدد منطقتك المناخية لأن الخليل لا تشبه غزة أو أريحا." },
  { icon: Sprout, title: "اختر المحصول وتاريخ الزراعة", text: "تصفح الدليل واختر ما تريد زراعته، وسنوضح لك إن كان التاريخ ضمن المواعيد المقترحة لمنطقتك." },
  { icon: CalendarCheck2, title: "تابع خطتك في الرزنامة", text: "نولّد لك مهام تجهيز التربة والزراعة والري والتسميد والمتابعة والحصاد، ويمكنك تعديلها أو إضافة مهامك." },
];

const FEATURES = [
  { icon: BookOpenText, title: "دليل محاصيل عربي", text: "معلومات زراعة وعناية وحصاد ومشكلات شائعة، مع توضيح أن البيانات أولية قابلة للمراجعة." },
  { icon: CalendarDays, title: "رزنامة تفاعلية", text: "عرض شهري وأسبوعي وقائمة، بأسماء الأشهر الشامية وتوقيت فلسطين." },
  { icon: BellRing, title: "تذكيرات داخل المنصة", text: "تنبيه بالمهام المتأخرة والقريبة كي لا يفوتك موعد ري أو تسميد." },
  { icon: CloudSun, title: "طقس زراعي", text: "توقعات الأيام القادمة مع تنبيهات الصقيع والحر والأمطار والرياح." },
  { icon: Smartphone, title: "مصممة للجوال", text: "استخدمها من الحديقة مباشرة بشريط تنقل سفلي وواجهات خفيفة." },
  { icon: ShieldCheck, title: "خصوصية بياناتك", text: "بيانات كل مستخدم معزولة على مستوى قاعدة البيانات، ولا نبيع بياناتك." },
];

function currentSeason(month: number) {
  return SEASONS.find((s) => SEASON_MONTHS[s].includes(month)) ?? "spring";
}

export default async function HomePage() {
  const [{ crops }, faqs] = await Promise.all([getCrops(), getFaqs()]);
  const today = todayInTimeZone();
  const featured = ["tomato", "cucumber", "lettuce", "strawberry", "zaatar", "olive"]
    .map((slug) => crops.find((c) => c.slug === slug))
    .filter((c) => c !== undefined);
  const previewCrops = crops.filter((c) => c.growthDaysMin != null);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-grid-soft absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="container-page grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <div className="animate-rise space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-surface px-3 py-1 text-sm font-semibold text-brand-700 shadow-xs">
              <Sprout className="size-4 text-lime-600" aria-hidden />
              لفلسطين وبلاد الشام
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.3] text-foreground sm:text-5xl lg:text-[3.1rem]">
              ازرع في الوقت المناسب…
              <span className="block text-brand-600">ودع رزنامتك تهتم بالباقي</span>
            </h1>
            <p className="max-w-xl text-lg leading-8 text-muted-foreground">
              خطط لمحاصيلك، اكتشف أفضل مواعيد الزراعة، وتابع الري والتسميد والحصاد من مكان واحد، وفق منطقتك وموسمك.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/planner">
                  ابدأ خطتك الزراعية <ArrowLeft />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/crops">استكشف المحاصيل</Link>
              </Button>
            </div>
            <p className="text-sm text-subtle-foreground">مجانية بالكامل للمزايا الأساسية، وتعمل دون حساب.</p>
          </div>
          <HeroVisual />
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how" className="container-page py-14 sm:py-20">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-2 text-sm font-bold text-lime-600">كيف تعمل المنصة</p>
          <h2 id="how" className="text-3xl font-extrabold">ثلاث خطوات من الفكرة إلى الحصاد</h2>
        </div>
        <ol className="grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border border-border bg-surface p-6 shadow-xs">
              <span className="absolute end-5 top-5 text-5xl font-extrabold text-brand-100">{i + 1}</span>
              <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <s.icon className="size-6" aria-hidden />
              </span>
              <h3 className="mb-2 text-lg font-bold">{s.title}</h3>
              <p className="text-sm leading-7 text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Interactive preview */}
      <section aria-labelledby="preview" className="bg-gradient-to-b from-brand-50 to-background py-14 sm:py-20">
        <div className="container-page">
          <div className="mb-8 max-w-2xl">
            <p className="mb-2 text-sm font-bold text-lime-600">جرّبها الآن</p>
            <h2 id="preview" className="text-3xl font-extrabold">معاينة تفاعلية للرزنامة الزراعية</h2>
            <p className="mt-3 text-muted-foreground">غيّر المحصول والمنطقة وتاريخ الزراعة، وشاهد كيف تتوزع المهام على الأيام.</p>
          </div>
          <PlanPreview crops={previewCrops} defaultDate={today} />
        </div>
      </section>

      {/* Popular crops */}
      <section aria-labelledby="crops" className="container-page py-14 sm:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-bold text-lime-600">دليل المحاصيل</p>
            <h2 id="crops" className="text-3xl font-extrabold">محاصيل شائعة في حدائقنا</h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/crops">
              كل المحاصيل <ArrowLeft />
            </Link>
          </Button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((crop) => (
            <CropCard key={crop.slug} crop={crop} />
          ))}
        </div>
      </section>

      {/* Seasons */}
      <section aria-labelledby="seasons" className="container-page pb-14 sm:pb-20">
        <div className="mb-8 max-w-2xl">
          <p className="mb-2 text-sm font-bold text-lime-600">مواعيد الزراعة</p>
          <h2 id="seasons" className="text-3xl font-extrabold">ماذا تزرع في كل فصل؟</h2>
          <p className="mt-3 text-muted-foreground">اختر الفصل ومنطقتك المناخية لترى المحاصيل التي تقع مواعيد زراعتها المقترحة فيه.</p>
        </div>
        <SeasonExplorer crops={crops} initialSeason={currentSeason(monthOf(today))} />
      </section>

      {/* Alerts preview */}
      <section aria-labelledby="alerts" className="bg-surface py-14 sm:py-20">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <p className="text-sm font-bold text-lime-600">التنبيهات</p>
            <h2 id="alerts" className="text-3xl font-extrabold">تذكيرات الري والتسميد وتنبيهات الطقس</h2>
            <p className="leading-8 text-muted-foreground">
              تجمع لوحتك مهام اليوم والمتأخرة، وتنبّهك عند توقع صقيع أو حر شديد أو أمطار. نحن لا نقرر عنك متى تروي: نذكّرك بالمتابعة وننصحك بفحص رطوبة التربة، لأن الحاجة الفعلية تختلف حسب التربة والنبات.
            </p>
            <Button asChild variant="secondary">
              <Link href="/weather">
                شاهد طقس منطقتك <ArrowLeft />
              </Link>
            </Button>
          </div>
          <div className="space-y-3" aria-label="أمثلة توضيحية على التنبيهات">
            <p className="text-xs font-semibold text-subtle-foreground">أمثلة توضيحية</p>
            {[
              { icon: Droplets, tone: "bg-[var(--task-irrigation-soft)] text-[var(--task-irrigation)]", title: "متابعة ري الخيار — اليوم", text: "افحص رطوبة التربة على عمق 3–5 سم قبل الري." },
              { icon: FlaskConical, tone: "bg-[var(--task-fertilizing-soft)] text-[var(--task-fertilizing)]", title: "تسميد البندورة عند التزهير — غدًا", text: "سماد متوازن بعيدًا قليلًا عن الساق ثم الري." },
              { icon: Snowflake, tone: "bg-info-soft text-info", title: "احتمال صقيع ليلة الخميس", text: "غطِّ الأشتال الحساسة وانقل الأصص إلى مكان محمي." },
              { icon: ThermometerSun, tone: "bg-warning-soft text-warning", title: "حرارة مرتفعة متوقعة", text: "تجنّب الشتل وقت الظهيرة وفكّر في التظليل." },
            ].map((a) => (
              <div key={a.title} className="flex items-start gap-3 rounded-xl border border-border bg-background p-4">
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${a.tone}`}>
                  <a.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="font-bold">{a.title}</p>
                  <p className="text-sm text-muted-foreground">{a.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section aria-labelledby="features" className="container-page py-14 sm:py-20">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-2 text-sm font-bold text-lime-600">المزايا</p>
          <h2 id="features" className="text-3xl font-extrabold">كل ما تحتاجه لتنظيم زراعتك</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
              <f.icon className="mb-4 size-7 text-brand-600" aria-hidden />
              <h3 className="mb-2 font-bold">{f.title}</h3>
              <p className="text-sm leading-7 text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" aria-labelledby="faq-title" className="container-page scroll-mt-20 pb-14 sm:pb-20">
        <div className="mx-auto max-w-3xl">
          <h2 id="faq-title" className="mb-8 text-center text-3xl font-extrabold">الأسئلة الشائعة</h2>
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {faqs.map((f) => (
              <details key={f.id} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold">
                  {f.question}
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-8 text-muted-foreground">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />
      </section>

      {/* CTA */}
      <section className="container-page pb-16 sm:pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12">
          <div className="absolute -start-16 -top-16 size-56 rounded-full bg-lime-500/25 blur-2xl" aria-hidden />
          <div className="absolute -bottom-20 -end-10 size-64 rounded-full bg-white/10 blur-2xl" aria-hidden />
          <h2 className="relative text-3xl font-extrabold">ابدأ موسمك القادم بخطة واضحة</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-primary-foreground/85">
            أنشئ خطتك الأولى في دقيقتين، واحفظها في حساب مجاني لتجدها على أي جهاز.
          </p>
          <div className="relative mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-brand-700 hover:bg-brand-50">
              <Link href="/auth/register">أنشئ حسابًا مجانيًا</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="text-primary-foreground hover:bg-white/10">
              <Link href="/planner">جرّب دون حساب</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
