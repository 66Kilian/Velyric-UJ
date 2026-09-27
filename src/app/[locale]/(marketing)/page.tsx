import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { About } from "@/components/landing/About";
import { Features } from "@/components/landing/Features";
import { FinalCta } from "@/components/landing/FinalCta";
import { HeroStory } from "@/components/landing/HeroStory";
import { Personal } from "@/components/landing/Personal";
import { UseCases } from "@/components/landing/UseCases";
import { JsonLd } from "@/components/seo/JsonLd";
import { routing } from "@/i18n/routing";
import { localizedAlternates } from "@/i18n/seo";
import { site } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return { alternates: localizedAlternates("/", locale) };
}

// A landing oldal: Hero + „Így dolgozik” (3D jel) → Kik vagyunk → Személyesen
// → Mit tud (egy hívás idővonala) → Kinek szól (iparág-fülek) → Záró CTA
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (hasLocale(routing.locales, locale)) setRequestLocale(locale);
  const t = await getTranslations("metadata");

  // Csak igaz, az oldalon is látható adatok (nincs kitalált értékelés vagy ár)
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${site.url}/#org`,
        name: site.name,
        url: site.url,
        logo: `${site.url}/icon.png`,
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+36-20-627-0766",
          contactType: "customer service",
          availableLanguage: ["hu", "de", "en"],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        name: site.name,
        url: site.url,
        description: t("description"),
        inLanguage: locale,
        publisher: { "@id": `${site.url}/#org` },
      },
    ],
  };

  return (
    <>
      <JsonLd data={structuredData} />
      <HeroStory />
      <About />
      <Personal />
      <Features />
      <UseCases />
      <FinalCta />
    </>
  );
}
