import { HomeHero } from "@/components/home/home-hero";
import { HomeVisual } from "@/components/home/home-visual";
import { MoreServices } from "@/components/home/more-services";
import { PlantNow } from "@/components/home/plant-now";
import { getFaqs } from "@/services/content";
import { listCrop } from "@/domain/crop-search";
import { getCrops } from "@/services/crops";

/** Real crops from the catalogue used as quick picks and examples. */
const QUICK = ["tomato", "cucumber", "lettuce", "zaatar", "strawberry", "olive", "mint"];
const EXAMPLES = ["tomato", "lettuce", "zaatar", "olive", "cucumber", "strawberry"];

export default async function HomePage() {
  const [{ crops }, faqs] = await Promise.all([getCrops(), getFaqs()]);
  // One shared, trimmed list: React serialises it once for both client components.
  const homeCrops = crops.map(listCrop);
  const quick = QUICK.map((slug) => crops.find((c) => c.slug === slug))
    .filter((c) => c !== undefined)
    .map((c) => ({ slug: c.slug, name: c.name.replace(/^ال/, "") }));

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };

  return (
    <>
      {/* First screen: location, the question, search and the three main actions. */}
      <section aria-label="ابدأ من هنا" className="relative bg-gradient-to-b from-brand-50 via-background to-background">
        <div className="container-page grid grid-cols-1 items-center gap-8 pt-4 pb-8 sm:pt-10 sm:pb-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12 lg:py-14">
          <HomeHero crops={homeCrops} quick={quick} />
          <HomeVisual className="home-enter hidden aspect-[5/4] lg:block" />
        </div>
      </section>

      {/* What fits now in the saved area (computed in the browser). */}
      <section aria-labelledby="plant-now" className="container-page pb-10 sm:pb-14">
        <div className="mb-4 flex flex-col gap-1">
          <h2 id="plant-now" className="text-2xl font-extrabold sm:text-3xl">يُزرع الآن في منطقتك</h2>
          <p className="text-sm text-muted-foreground">مواعيد أولية وعامة، وتختلف حسب الصنف والتربة والارتفاع.</p>
        </div>
        <PlantNow crops={homeCrops} examples={EXAMPLES} />
      </section>

      <div className="container-page pb-10 sm:pb-14 lg:hidden">
        <HomeVisual className="home-reveal aspect-[16/7]" />
      </div>

      {/* Everything else, one tap away. */}
      <section aria-labelledby="services" className="container-page pb-10 sm:pb-14">
        <h2 id="services" className="mb-4 text-2xl font-extrabold sm:text-3xl">كل الخدمات</h2>
        <MoreServices />
      </section>

      {/* FAQ */}
      <section id="faq" aria-labelledby="faq-title" className="container-page scroll-mt-20 pb-14 sm:pb-20">
        <div className="mx-auto max-w-3xl">
          <h2 id="faq-title" className="mb-4 text-2xl font-extrabold sm:text-3xl">أسئلة شائعة</h2>
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {faqs.map((f) => (
              <details key={f.id} className="group [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 font-bold transition-colors hover:bg-surface-muted sm:px-5">
                  {f.question}
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-lg text-accent-foreground transition-transform duration-200 group-open:rotate-45"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <p className="px-4 pb-4 leading-8 text-muted-foreground sm:px-5">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />
      </section>
    </>
  );
}
