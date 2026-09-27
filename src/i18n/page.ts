import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

type MetaKey = "login" | "signup" | "confirm" | "newPassword";

// Közös segéd az auth-oldalakhoz: cím, és ne indexelje a Google
export async function authMetadata(params: Promise<{ locale: string }>, key: MetaKey): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: hasLocale(routing.locales, locale) ? locale : "hu", namespace: "auth.meta" });
  return { title: t(key), robots: { index: false, follow: false } };
}

// Nyelv beállítása statikus rendereléshez (minden layoutban és oldalon hívandó)
export async function initLocale(params: Promise<{ locale: string }>) {
  const { locale } = await params;
  if (hasLocale(routing.locales, locale)) setRequestLocale(locale);
}
