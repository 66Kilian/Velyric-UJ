import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalDraft } from "@/components/legal/LegalDraft";
import { initLocale } from "@/i18n/page";
import { routing } from "@/i18n/routing";
import { localizedAlternates } from "@/i18n/seo";
import { hasLocale } from "next-intl";

// Amíg a végleges szöveg nincs kész, a keresők ne indexeljék
export async function generateMetadata({ params }: PageProps<"/[locale]/aszf">): Promise<Metadata> {
  await initLocale(params);
  const { locale } = await params;
  const t = await getTranslations("legal");
  return {
    alternates: localizedAlternates("/aszf", hasLocale(routing.locales, locale) ? locale : routing.defaultLocale), title: t("terms"), robots: { index: false, follow: true } };
}

export default async function Page({ params }: PageProps<"/[locale]/aszf">) {
  await initLocale(params);
  return <LegalDraft kind="terms" />;
}
