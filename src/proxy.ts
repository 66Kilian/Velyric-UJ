import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { DASHBOARD_SEGMENT, DASHBOARD_URL, isDashboardHost } from "./lib/dashboard/url";
import { site } from "./lib/site";
import { refreshSession } from "./lib/supabase/proxy";

const intl = createMiddleware(routing);

// A fő oldal minden (nyelvenkénti) útvonala – ezek a kezelő aldomainjén a fő oldalra visznek
const SITE_PATHS = new Set<string>(
  Object.values(routing.pathnames).flatMap((p) => (typeof p === "string" ? [p] : Object.values(p))),
);
SITE_PATHS.delete("/");

function splitLocale(pathname: string) {
  const m = pathname.match(/^\/(en|de)(?=\/|$)(.*)$/);
  return m ? { locale: m[1], rest: m[2] || "/" } : { locale: routing.defaultLocale, rest: pathname || "/" };
}

// Next 16-ban a middleware neve "proxy":
// 1) a kezelő aldomainje (kezelo.velyric.com) a /[locale]/kezelo útvonalakra kerül,
// 2) nyelvi átirányítás/útvonalak (next-intl), 3) Supabase munkamenet frissítése
export default async function proxy(request: NextRequest) {
  const host = request.headers.get("host");
  const { pathname } = request.nextUrl;

  if (isDashboardHost(host)) {
    const { locale, rest } = splitLocale(pathname);
    const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;

    // Jelszó-visszaállítás és e-mail megerősítés oldalai itt is működnek
    if (rest.startsWith("/auth/")) {
      const response = intl(request);
      await refreshSession(request, response);
      return response;
    }
    // A fő oldal útvonalai (pl. beállítás, ÁSZF) → a fő domainre
    if (SITE_PATHS.has(rest) || rest.startsWith("/megoldasok") || rest.startsWith("/solutions") || rest.startsWith("/loesungen")) {
      return NextResponse.redirect(new URL(`${localePrefix}${rest}`, site.url));
    }
    // A régi /kezelo előtagos címek → előtag nélkül
    if (rest === DASHBOARD_SEGMENT || rest.startsWith(`${DASHBOARD_SEGMENT}/`)) {
      const url = request.nextUrl.clone();
      url.pathname = `${localePrefix}${rest.slice(DASHBOARD_SEGMENT.length) || "/"}`;
      return NextResponse.redirect(url);
    }
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${DASHBOARD_SEGMENT}${rest === "/" ? "" : rest}`;
    const response = NextResponse.rewrite(url);
    await refreshSession(request, response);
    return response;
  }

  // Ha van külön kezelő-domain, a fő oldalon a /kezelo oda irányít
  if (DASHBOARD_URL) {
    const { locale, rest } = splitLocale(pathname);
    if (rest === DASHBOARD_SEGMENT || rest.startsWith(`${DASHBOARD_SEGMENT}/`)) {
      const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
      return NextResponse.redirect(`${DASHBOARD_URL}${localePrefix}${rest.slice(DASHBOARD_SEGMENT.length)}`);
    }
  }

  const response = intl(request);
  await refreshSession(request, response);
  return response;
}

export const config = {
  // Minden oldal, kivéve: API, az auth visszahívás (/auth/confirm), Next belső fájljai,
  // Vercel, és kiterjesztéses fájlok (képek, ikonok)
  matcher: "/((?!api|auth/confirm|_next|_vercel|.*\\..*).*)",
};
