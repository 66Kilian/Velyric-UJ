import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FinalCta } from "@/components/landing/FinalCta";
import { HeroScene } from "@/components/landing/HeroScene";
import { IndustriesPreview } from "@/components/landing/IndustriesPreview";
import { Personal } from "@/components/landing/Personal";
import { JsonLd } from "@/components/seo/JsonLd";
import { routing } from "@/i18n/routing";
import { localizedAlternates } from "@/i18n/seo";
import { site } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return { alternates: localizedAlternates("/", locale) };
}

// Főoldal: Hero → Kik vagyunk (24 órás számlap, a 3D jel beérkezik) → Megoldások (iparágak)
// → Személyesen → Záró CTA (a footer a layoutban)
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
          hoursAvailable: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            opens: "00:00",
            closes: "23:59",
          },
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
      <HeroScene />
      <IndustriesPreview />
      <Personal />
      <FinalCta />
    </>
  );
}
