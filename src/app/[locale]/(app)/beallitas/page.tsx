import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { SetupWizard } from "@/components/setup/SetupWizard";
import { redirect as nextRedirect } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { dashboardHref } from "@/lib/dashboard/url";
import { initLocale } from "@/i18n/page";
import { routing } from "@/i18n/routing";
import { parseOnboarding, type OnboardingData } from "@/lib/onboarding/schema";
import { aiConfigured } from "@/lib/server/ai";
import { demoApiAllowed } from "@/lib/server/guard";
import { getPlan } from "@/lib/server/stripe";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServer } from "@/lib/supabase/server";

// Mindig kérésidőben fut (munkamenet, mentett állapot) – soha nem gyorsítótárazott
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[locale]/beallitas">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale, namespace: "setup.meta" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

// BEÁLLÍTÁS – a bejelentkezés utáni, lépésenkénti onboarding.
// Valódi fióknál a szerver ellenőrzi a munkamenetet és betölti a mentett állapotot;
// bemutató módban a böngésző (teszt fiók) dönt.
export default async function SetupPage({ params, searchParams }: PageProps<"/[locale]/beallitas">) {
  await initLocale(params);
  const { locale } = await params;
  const loc = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;

  let user: { id: string; email: string } | null = null;
  let initial: OnboardingData | null = null;
  let paid = false;

  if (isSupabaseConfigured) {
    const supabase = await getSupabaseServer();
    const { data } = await supabase.auth.getClaims();
    const claims = data?.claims;
    if (!claims?.sub) return redirect({ href: "/bejelentkezes", locale: loc });
    const email = typeof claims.email === "string" ? claims.email : "";
    user = { id: claims.sub, email };
    const [{ data: row }, { data: sub }] = await Promise.all([
      supabase.from("onboarding").select("data").eq("user_id", claims.sub).maybeSingle(),
      supabase.from("subscriptions").select("status").eq("user_id", claims.sub).maybeSingle(),
    ]);
    initial = parseOnboarding(row?.data, email);
    paid = sub?.status === "active" || sub?.status === "trialing";
    // Kész beállítás → a kezelőbe (módosításhoz: ?szerkesztes=1)
    const { szerkesztes, fizetes } = await searchParams;
    if (initial.completedAt && !szerkesztes && !fizetes) nextRedirect(dashboardHref(loc));
  }

  const plan = await getPlan();
  return (
    <SetupWizard
      user={user}
      initial={initial}
      serverPaid={paid}
      plan={plan}
      aiMode={aiConfigured && (isSupabaseConfigured || demoApiAllowed) ? "ai" : "template"}
    />
  );
}
