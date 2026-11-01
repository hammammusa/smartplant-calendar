import "@fontsource/cairo/400.css";
import "@fontsource/cairo/500.css";
import "@fontsource/cairo/600.css";
import "@fontsource/cairo/700.css";
import "@fontsource/cairo/800.css";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AppDataProvider } from "@/components/providers/app-data-provider";
import { IS_PRIVATE_SITE, SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(`${SITE_URL}/`),
  title: { default: `${SITE_NAME} — خطط لزراعتك في الوقت المناسب`, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["رزنامة زراعية", "مواعيد الزراعة", "زراعة منزلية", "فلسطين", "بلاد الشام", "ري", "تسميد", "حصاد", "زراعة الأسطح"],
  openGraph: {
    type: "website",
    locale: "ar_PS",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: SITE_DESCRIPTION },
  alternates: { canonical: absoluteUrl("/") },
  referrer: "strict-origin-when-cross-origin",
  ...(IS_PRIVATE_SITE ? { robots: { index: false, follow: false, nocache: true } } : {}),
};

export const viewport: Viewport = {
  themeColor: "#166534",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
        >
          تخطَّ إلى المحتوى
        </a>
        <AppDataProvider>
          <SiteHeader />
          <main id="main" className="flex flex-1 flex-col">
            {children}
          </main>
          <SiteFooter />
          <MobileTabBar />
        </AppDataProvider>
        <Toaster dir="rtl" position="top-center" richColors closeButton containerAriaLabel="الإشعارات" toastOptions={{ closeButtonAriaLabel: "إغلاق الإشعار", style: { fontFamily: "var(--font-sans)" } }} />
      </body>
    </html>
  );
}
