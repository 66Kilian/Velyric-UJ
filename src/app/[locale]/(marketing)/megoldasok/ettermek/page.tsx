import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { IndustryPage } from "@/components/industry/IndustryPage";
import { routing } from "@/i18n/routing";
import { localizedAlternates } from "@/i18n/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/megoldasok/ettermek">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "industries.restaurant" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    alternates: localizedAlternates("/megoldasok/ettermek", locale),
  };
}

// Iparági megoldás-oldal (restaurant)
export default async function Page({ params }: PageProps<"/[locale]/megoldasok/ettermek">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <IndustryPage industry="restaurant" locale={locale} />;
}
