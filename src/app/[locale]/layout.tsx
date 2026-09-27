import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { ogLocale } from "@/i18n/seo";
import { site } from "@/lib/site";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { Toaster } from "@/components/ui/Toaster";
import "../globals.css";

// Montserrat saját kiszolgálással (nincs külső kérés); latin-ext kell az ő/ű betűkhöz
const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  variable: "--font-montserrat",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#fff7fb",
  colorScheme: "light",
};

// Minden nyelvhez előre legenerált (statikus, gyors) oldalak
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const requested = (await params).locale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    metadataBase: new URL(site.url),
    title: { default: t("title"), template: `%s · ${site.name}` },
    description: t("description"),
    applicationName: site.name,
    openGraph: {
      type: "website",
      siteName: site.name,
      title: t("title"),
      description: t("description"),
      locale: ogLocale[locale],
    },
    twitter: { card: "summary_large_image", title: t("title"), description: t("description") },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Statikus renderelés engedélyezése az adott nyelvre
  setRequestLocale(locale);

  return (
    <html lang={locale} className={montserrat.variable} data-scroll-behavior="smooth">
      <body className="min-h-dvh bg-canvas font-sans text-ink antialiased">
        <NextIntlClientProvider>
          <MotionProvider>
            {children}
            <Toaster />
            <SmoothScroll />
          </MotionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
