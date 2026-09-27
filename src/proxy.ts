import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { refreshSession } from "./lib/supabase/proxy";

const intl = createMiddleware(routing);

// Next 16-ban a middleware neve "proxy":
// 1) nyelvi átirányítás/útvonalak (next-intl), 2) Supabase munkamenet frissítése
export default async function proxy(request: NextRequest) {
  const response = intl(request);
  await refreshSession(request, response);
  return response;
}

export const config = {
  // Minden oldal, kivéve: API, az auth visszahívás (/auth/confirm), Next belső fájljai,
  // Vercel, és kiterjesztéses fájlok (képek, ikonok)
  matcher: "/((?!api|auth/confirm|_next|_vercel|.*\\..*).*)",
};
