import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing, type AppPathname } from "@/i18n/routing";
import { site } from "@/lib/site";

// Csak a nyilvános, indexelhető oldalak (az auth és a még piszkozat jogi oldalak nem)
const PUBLIC: { href: AppPathname; lastModified: string }[] = [{ href: "/", lastModified: "2026-09-27" }];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC.flatMap(({ href, lastModified }) =>
    routing.locales.map((locale) => ({
      url: `${site.url}${getPathname({ locale, href })}`,
      lastModified,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${site.url}${getPathname({ locale: l, href })}`]),
        ),
      },
    })),
  );
}
