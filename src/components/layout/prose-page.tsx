import { PageHeader } from "./page-header";

export function ProsePage({ title, updated, children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <div className="container-page max-w-3xl py-10 sm:py-14">
      <PageHeader title={title} description={updated ? `آخر تحديث: ${updated}` : undefined} />
      <div className="mt-8 space-y-6 leading-8 text-foreground/85 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-foreground [&_li]:ms-5 [&_ul]:list-disc [&_ul]:space-y-1">
        {children}
      </div>
    </div>
  );
}
