"use client";

import { AnimatePresence, m } from "framer-motion";
import { Phone, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, type RefObject } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { useSectionNav } from "@/hooks/useSectionNav";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { lockScroll, unlockScroll } from "@/lib/scroll-lock";
import { navSections, site } from "@/lib/site";
import { LanguageSegmented } from "./LanguageSwitcher";

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  active: string | null;
  /** A hamburger gomb – bezáráskor ide tér vissza a fókusz */
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  loggedIn: boolean;
  onSignOut: () => void;
};


// Teljes képernyős mobilmenü, jobbról becsúszva, nagy gombokkal
export function MobileMenu({ open, onClose, active, returnFocusRef, loggedIn, onSignOut }: MobileMenuProps) {
  const t = useTranslations("nav");
  const tSession = useTranslations("auth.session");
  const { goTo } = useSectionNav();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Nyitáskor: görgetés tiltása, fókusz a bezáró gombra, Esc + fókuszcsapda
  useEffect(() => {
    if (!open) return;
    const returnTo = returnFocusRef.current;
    lockScroll();
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = panelRef.current.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled])",
      );
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    // Ha a képernyő asztali méretűre nő, a menü magától bezárul
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onDesktop = () => desktop.matches && onClose();

    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onDesktop);
    return () => {
      unlockScroll();
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onDesktop);
      returnTo?.focus({ preventScroll: true });
    };
  }, [open, onClose, returnFocusRef]);

  return (
    <AnimatePresence>
      {open && (
        <m.div
          ref={panelRef}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label={t("menu")}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: DURATION.drawer, ease: EASE_OUT }}
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-base-900 lg:hidden"
        >

          <div className="relative flex h-[var(--nav-h)] shrink-0 items-center justify-between px-5 sm:px-8">
            <Logo size="md" />
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label={t("closeMenu")}
              className="-mr-2 flex size-12 items-center justify-center rounded-xl text-fg transition-colors hover:bg-base-700"
            >
              <X className="size-6" aria-hidden="true" />
            </button>
          </div>

          <nav aria-label={t("mainNav")} className="relative flex-1 px-5 pt-6 sm:px-8">
            <ul className="flex flex-col gap-1">
              {navSections.map((section, i) => (
                <m.li
                  key={section.id}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: DURATION.item, ease: EASE_OUT, delay: 0.1 + i * 0.05 }}
                >
                  <Link
                    href={{ pathname: "/", hash: section.id }}
                    onClick={(e) => {
                      goTo(e, section.id);
                      onClose();
                    }}
                    aria-current={active === section.id ? "location" : undefined}
                    className={cn(
                      "flex min-h-16 items-center gap-4 border-b border-line text-3xl font-semibold tracking-tight transition-colors",
                      active === section.id ? "text-fg" : "text-muted hover:text-fg",
                    )}
                  >
                    {/* Aktív szekció: rövid gradiens-jelölő (a Velyric „hangja”), nem színes szöveg */}
                    <span
                      aria-hidden="true"
                      className={cn("h-7 w-1 rounded-full bg-brand transition-opacity", active === section.id ? "opacity-100" : "opacity-0")}
                    />
                    {t(section.labelKey)}
                  </Link>
                </m.li>
              ))}
            </ul>
          </nav>

          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.item, ease: EASE_OUT, delay: 0.25 }}
            className="relative flex flex-col gap-3 px-5 pt-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8"
          >
            <Button href="/regisztracio" size="lg" onClick={onClose} className="w-full">
              {t("start")}
            </Button>
            {loggedIn ? (
              <Button
                size="lg"
                variant="secondary"
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
                className="w-full"
              >
                {tSession("logout")}
              </Button>
            ) : (
              <Button href="/bejelentkezes" size="lg" variant="secondary" onClick={onClose} className="w-full">
                {t("login")}
              </Button>
            )}
            <LanguageSegmented className="mt-3" />
            <a
              href={site.phoneHref}
              className="mt-2 flex h-12 items-center justify-center gap-2 text-sm font-medium text-muted transition-colors hover:text-fg"
            >
              <Phone className="size-4" aria-hidden="true" />
              {site.phone}
            </a>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
