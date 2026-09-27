import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { IndustryPage } from "@/components/industry/IndustryPage";
import { routing } from "@/i18n/routing";
import { localizedAlternates } from "@/i18n/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/megoldasok/autoszervizek">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "industries.auto" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: { title: t("metaTitle"), description: t("metaDescription") },
    alternates: localizedAlternates("/megoldasok/autoszervizek", locale),
  };
}

// Iparági megoldás-oldal (auto)
export default async function Page({ params }: PageProps<"/[locale]/megoldasok/autoszervizek">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <IndustryPage industry="auto" locale={locale} />;
}
