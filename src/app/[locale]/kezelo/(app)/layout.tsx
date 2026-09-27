import { hasLocale } from "next-intl";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardApp } from "@/components/dashboard/DashboardApp";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import type { DemoData } from "@/lib/dashboard/demo";
import { DASHBOARD_SEGMENT, DASHBOARD_URL, dashPath, isDashboardHost } from "@/lib/dashboard/url";
import { parseOnboarding } from "@/lib/onboarding/schema";
import { aiConfigured } from "@/lib/server/ai";
import { demoApiAllowed } from "@/lib/server/guard";
import { site } from "@/lib/site";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const daysAgoIso = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

// A kezelő védett része: csak bejelentkezve (és ha be van kapcsolva, kétlépcsős azonosítással),
// és csak ha a beállítás kész. Az adatokat a felhasználó saját jogosultságával olvassuk (RLS).
export default async function DashboardAppLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale: raw } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  const host = (await headers()).get("host");
  const base = isDashboardHost(host) ? "" : DASHBOARD_SEGMENT;
  const setupUrl = `${DASHBOARD_URL && isDashboardHost(host) ? site.url : ""}${getPathname({ locale, href: "/beallitas" })}`;
  const aiMode = aiConfigured && (isSupabaseConfigured || demoApiAllowed) ? "ai" : "template";

  if (!isSupabaseConfigured) {
    return (
      <DashboardApp init={{ mode: "demo", base, user: null, onboarding: null, workspace: null, data: null, paid: false }} aiMode={aiMode} setupUrl={setupUrl}>
        {children}
      </DashboardApp>
    );
  }

  const supabase = await getSupabaseServer();
  const { data: auth } = await supabase.auth.getClaims();
  const claims = auth?.claims;
  if (!claims?.sub) redirect(dashPath(locale, base, "/belepes"));

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") redirect(`${dashPath(locale, base, "/belepes")}?mfa=1`);

  const uid = claims.sub;
  const email = typeof claims.email === "string" ? claims.email : "";
  const since = daysAgoIso(8);
  const [ob, ws, calls, issues, bookings, sub] = await Promise.all([
    supabase.from("onboarding").select("data").eq("user_id", uid).maybeSingle(),
    supabase.from("workspaces").select("*").eq("user_id", uid).maybeSingle(),
    supabase.from("calls").select("id,status,started_at,ended_at,caller_number,caller_name,summary,category,sentiment,outcome,transcript").eq("user_id", uid).gte("started_at", since).order("started_at", { ascending: false }).limit(400),
    supabase.from("issues").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(300),
    supabase.from("bookings").select("*").eq("user_id", uid).gte("starts_at", since).order("starts_at").limit(300),
    supabase.from("subscriptions").select("status").eq("user_id", uid).maybeSingle(),
  ]);

  const onboarding = parseOnboarding(ob.data?.data, email);
  if (!onboarding.completedAt) redirect(setupUrl);

  const data = { calls: calls.data ?? [], issues: issues.data ?? [], bookings: bookings.data ?? [] } as DemoData;
  return (
    <DashboardApp
      init={{ mode: "real", base, user: { id: uid, email }, onboarding, workspace: ws.data, data, paid: sub.data?.status === "active" || sub.data?.status === "trialing" }}
      aiMode={aiMode}
      setupUrl={setupUrl}
    >
      {children}
    </DashboardApp>
  );
}
