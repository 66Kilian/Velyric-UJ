"use client";

import { CalendarDays, LayoutDashboard, ListChecks, LogOut, PhoneCall, Settings2, Sparkles, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Orb } from "@/components/setup/Guide";
import { cn } from "@/lib/cn";
import { demoSignOut } from "@/lib/demo";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useDashboard } from "./DashboardProvider";

export type NavItem = { key: string; path: string; icon: LucideIcon; label: string; tour?: string; badge?: number };

// A kezelőben használt, a vállalkozás jellegéhez igazodó elnevezések
export function useKindLabels() {
  const t = useTranslations("dash.kind");
  const { workspace } = useDashboard();
  const kind = workspace.prefs.kind;
  return {
    kind,
    issues: t(`${kind}.issues`),
    issue: t(`${kind}.issue`),
    bookings: kind === "cases" ? null : t(`${kind}.bookings`),
    resolved: t(`${kind}.resolved`),
    open: t(`${kind}.open`),
  };
}

export function useNav(): NavItem[] {
  const t = useTranslations("dash.nav");
  const { issues } = useDashboard();
  const labels = useKindLabels();
  const open = issues.filter((i) => i.status === "open").length;
  return [
    { key: "home", path: "/", icon: LayoutDashboard, label: t("home") },
    { key: "calls", path: "/hivasok", icon: PhoneCall, label: t("calls"), tour: "nav-calls" },
    ...(labels.bookings ? [{ key: "bookings", path: "/foglalasok", icon: CalendarDays, label: labels.bookings }] : []),
    { key: "issues", path: "/ugyek", icon: ListChecks, label: labels.issues, tour: "nav-issues", badge: open },
    { key: "assistant", path: "/asszisztens", icon: Sparkles, label: t("assistant"), tour: "nav-assistant" },
    { key: "settings", path: "/beallitasok", icon: Settings2, label: t("settings"), tour: "nav-settings" },
  ];
}

// A KEZELŐ KERETE: asztalon oldalsáv, mobilon felső sáv + alsó fülsor
export function Shell({ children, loginHref }: { children: ReactNode; loginHref: string }) {
  const t = useTranslations("dash");
  const { onboarding, user, href, calls, workspace } = useDashboard();
  const nav = useNav();
  const pathname = usePathname();
  const live = calls.filter((c) => c.status === "active").length;
  const business = onboarding.profile?.businessName || onboarding.business.name;
  const isActive = (path: string) => {
    const target = href(path);
    return path === "/" ? pathname === target || pathname === `${target}/` : pathname.startsWith(target);
  };

  const signOut = async () => {
    const supabase = getSupabaseBrowser();
    const { data } = (await supabase?.auth.getUser()) ?? { data: null };
    if (supabase && data?.user) await supabase.from("security_events").insert({ user_id: data.user.id, type: "logout" });
    demoSignOut();
    await supabase?.auth.signOut();
    window.location.assign(loginHref);
  };

  return (
    <div className={cn("relative isolate min-h-dvh", workspace.prefs.density === "compact" && "dash-compact")}>
      <Ambient />

      {/* ---- Oldalsáv (asztal) ---- */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[17.5rem] flex-col border-r border-line bg-surface/60 px-5 py-6 backdrop-blur-xl lg:flex">
        <div className="flex items-center gap-3 px-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-cta font-display text-lg font-bold text-white">{(business || "V").charAt(0).toUpperCase()}</span>
          <div className="min-w-0">
            <p className="truncate font-display text-[1.05rem] leading-tight font-semibold">{business}</p>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">Velyric</p>
          </div>
        </div>

        <nav aria-label={t("nav.label")} className="mt-10 flex-1">
          <ul className="flex flex-col gap-1">
            {nav.map((item) => {
              const active = isActive(item.path);
              return (
                <li key={item.key}>
                  <NextLink
                    href={href(item.path)}
                    data-tour={item.tour}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex h-11 items-center gap-3 rounded-xl px-3 text-[0.95rem] font-medium transition-colors",
                      active ? "bg-raised text-ink" : "text-muted hover:bg-raised/60 hover:text-ink",
                    )}
                  >
                    {active && <span aria-hidden="true" className="absolute inset-y-2.5 -left-5 w-1 rounded-r-full bg-brand" />}
                    <item.icon className={cn("size-[1.15rem]", active && "text-accent-ink")} aria-hidden="true" />
                    <span className="flex-1">{item.label}</span>
                    {!!item.badge && (
                      <span className="tabular rounded-full bg-cta px-2 py-0.5 text-[11px] font-bold text-white">{item.badge}</span>
                    )}
                  </NextLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="rounded-panel border border-line bg-canvas/50 p-4">
          <div className="flex items-center gap-3">
            <Orb active={live > 0} />
            <div className="min-w-0">
              <p className="truncate font-semibold">{onboarding.voice.agentName}</p>
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <span className="live-dot size-1.5 rounded-full bg-success" aria-hidden="true" />
                {live ? t("shell.onCall", { count: live }) : t("shell.listening")}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 px-2">
          <p className="min-w-0 truncate text-xs text-muted" title={user.email}>
            {user.email}
          </p>
          <button type="button" onClick={signOut} aria-label={t("shell.logout")} title={t("shell.logout")} className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-raised hover:text-ink">
            <LogOut className="size-4" aria-hidden="true" />
          </button>
        </div>
      </aside>

      {/* ---- Felső sáv (mobil) ---- */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-canvas/80 px-4 backdrop-blur-xl lg:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-cta font-display font-bold text-white">{(business || "V").charAt(0).toUpperCase()}</span>
          <p className="truncate font-display font-semibold">{business}</p>
        </div>
        <button type="button" onClick={signOut} aria-label={t("shell.logout")} className="flex size-11 items-center justify-center rounded-xl text-muted hover:bg-raised">
          <LogOut className="size-5" aria-hidden="true" />
        </button>
      </header>

      <main id="tartalom" className="relative pb-32 lg:pb-16 lg:pl-[17.5rem]">
        <div className="mx-auto w-full max-w-[88rem] px-4 pt-6 sm:px-8 sm:pt-10 lg:px-12">{children}</div>
      </main>

      {/* ---- Alsó fülsor (mobil) ---- */}
      <nav aria-label={t("nav.label")} className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
          {nav.map((item) => {
            const active = isActive(item.path);
            return (
              <li key={item.key}>
                <NextLink
                  href={href(item.path)}
                  data-tour={item.tour}
                  aria-current={active ? "page" : undefined}
                  className={cn("relative flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-semibold", active ? "text-ink" : "text-muted")}
                >
                  <item.icon className={cn("size-5", active && "text-accent-ink")} aria-hidden="true" />
                  <span className="max-w-full truncate px-1">{item.label}</span>
                  {!!item.badge && <span className="absolute top-2 right-[calc(50%-1.1rem)] size-2 rounded-full bg-[var(--pink)]" aria-hidden="true" />}
                </NextLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

// Háttér: nagyon finom, a választott színből derengő fény
function Ambient() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="cloud-float absolute -top-56 right-[-10%] h-[40rem] w-[48rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--pink)_14%,transparent),transparent)] blur-3xl" />
      <div className="cloud-float-slow absolute bottom-[-20rem] left-[10%] h-[36rem] w-[52rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--magenta)_9%,transparent),transparent)] blur-3xl" />
    </div>
  );
}
