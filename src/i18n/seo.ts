import { getPathname } from "./navigation";
import { routing, type AppPathname, type Locale } from "./routing";

// canonical + hreflang (hu/en/de + x-default) egy oldalhoz, a lokalizált URL-ekkel
export function localizedAlternates(href: AppPathname, locale: Locale) {
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, getPathname({ locale: l, href })]),
  ) as Record<Locale, string>;
  return {
    canonical: languages[locale],
    languages: { ...languages, "x-default": languages[routing.defaultLocale] },
  };
}

export const ogLocale: Record<Locale, string> = { hu: "hu_HU", en: "en_US", de: "de_DE" };
