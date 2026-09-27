import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, type AppPathname } from "@/i18n/routing";
import { localizedAlternates } from "@/i18n/seo";

type MetaKey = "login" | "signup" | "confirm" | "newPassword";

const PATHS: Record<MetaKey, AppPathname> = {
  login: "/bejelentkezes",
  signup: "/regisztracio",
  confirm: "/auth/megerosites",
  newPassword: "/auth/uj-jelszo",
};

// Közös segéd az auth-oldalakhoz: cím, és ne indexelje a Google
export async function authMetadata(params: Promise<{ locale: string }>, key: MetaKey): Promise<Metadata> {
  const { locale } = await params;
  const loc = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const t = await getTranslations({ locale: loc, namespace: "auth.meta" });
  return { title: t(key), robots: { index: false, follow: false }, alternates: localizedAlternates(PATHS[key], loc) };
}

// Nyelv beállítása statikus rendereléshez (minden layoutban és oldalon hívandó)
export async function initLocale(params: Promise<{ locale: string }>) {
  const { locale } = await params;
  if (hasLocale(routing.locales, locale)) setRequestLocale(locale);
}
