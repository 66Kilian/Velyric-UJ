import type { EmailOtpType } from "@supabase/supabase-js";
import { hasLocale } from "next-intl";
import { NextResponse, type NextRequest } from "next/server";
import { getPathname } from "@/i18n/navigation";
import { routing, type AppPathname } from "@/i18n/routing";
import { dashPath, isDashboardHost } from "@/lib/dashboard/url";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServer } from "@/lib/supabase/server";

// Ide érkeznek a Supabase-linkek: e-mail megerősítés, jelszó-visszaállítás, Google.
// Két formát is kezel:
//  - token_hash + type (ajánlott e-mail sablon → másik eszközön megnyitva is működik)
//  - code (PKCE: Google, illetve az alap e-mail sablon)
const ALLOWED_NEXT: AppPathname[] = ["/", "/beallitas", "/auth/megerosites", "/auth/uj-jelszo"];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const localeParam = searchParams.get("locale");
  const locale = hasLocale(routing.locales, localeParam) ? localeParam : routing.defaultLocale;
  // A kezelő bejelentkezése (Google) ide tér vissza: siker után a kezelő főoldalára
  const toDashboard = searchParams.get("next") === "/kezelo";
  const nextParam = searchParams.get("next") as AppPathname | null;
  const next = nextParam && ALLOWED_NEXT.includes(nextParam) ? nextParam : "/auth/megerosites";

  // Hiba esetén: jelszónál az új-jelszó oldal, Google-nél a bejelentkezés, egyébként a megerősítés oldal
  const failTo: AppPathname =
    next === "/auth/uj-jelszo" ? "/auth/uj-jelszo" : next === "/" || next === "/beallitas" ? "/bejelentkezes" : "/auth/megerosites";

  const redirectTo = (href: AppPathname, error?: string) => {
    const url = new URL(getPathname({ locale, href }), origin);
    if (error) url.searchParams.set("error", error);
    return NextResponse.redirect(url);
  };

  if (!isSupabaseConfigured) return redirectTo(failTo, "config");
  if (searchParams.get("error")) return redirectTo(failTo, "expired");

  const supabase = await getSupabaseServer();
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  let failed = true;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    failed = !!error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    failed = !!error;
  }

  if (toDashboard) {
    const base = isDashboardHost(request.headers.get("host")) ? "" : "/kezelo";
    const target = new URL(dashPath(locale, base, failed ? "/belepes" : "/"), origin);
    if (failed) target.searchParams.set("error", "oauth");
    return NextResponse.redirect(target);
  }
  if (failed) return redirectTo(failTo, "expired");
  const response = redirectTo(next);
  if (next === "/" || next === "/beallitas") {
    // Google-belépés után üdvözlő értesítés jelenik meg
    const url = new URL(response.headers.get("location")!);
    url.searchParams.set("welcome", "1");
    response.headers.set("location", url.toString());
  }
  return response;
}
