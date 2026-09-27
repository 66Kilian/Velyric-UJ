import { routing, type Locale } from "@/i18n/routing";

// A kezelőfelület címe. Élesben saját aldomain (pl. https://kezelo.velyric.com),
// amíg az nincs beállítva, ugyanazon a domainen a /kezelo útvonal alatt fut.
export const DASHBOARD_URL = (process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "").replace(/\/$/, "");
export const DASHBOARD_HOST = DASHBOARD_URL ? new URL(DASHBOARD_URL).host : "";
export const DASHBOARD_SEGMENT = "/kezelo";

export function isDashboardHost(host: string | null | undefined): boolean {
  if (!host) return false;
  return (DASHBOARD_HOST && host === DASHBOARD_HOST) || host.startsWith("kezelo.");
}

const prefix = (locale: string) => (locale === routing.defaultLocale ? "" : `/${locale}`);

// Belső hivatkozás a kezelőn belül: aldomainen előtag nélkül, egyébként /kezelo alatt
export function dashPath(locale: string, base: string, path = "/") {
  const p = path === "/" ? "" : path;
  return `${prefix(locale)}${base}${p}` || "/";
}

// A kezelő teljes címe (a fő oldalról odairányításhoz)
export function dashboardHref(locale: Locale | string, path = "/") {
  const p = path === "/" ? "" : path;
  if (DASHBOARD_URL) return `${DASHBOARD_URL}${prefix(locale)}${p}` || DASHBOARD_URL;
  return `${prefix(locale)}${DASHBOARD_SEGMENT}${p}`;
}
