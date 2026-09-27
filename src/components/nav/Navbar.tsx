"use client";

import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useScrolled } from "@/hooks/useScrolled";
import { useSectionNav } from "@/hooks/useSectionNav";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { navSections } from "@/lib/site";
import { LanguageDropdown } from "./LanguageSwitcher";
import { MobileMenu } from "./MobileMenu";

const sectionIds = navSections.map((s) => s.id);

// Sticky navbar: legfelül átlátszó, görgetéskor lágyan sötét, elmosott háttérre vált
export function Navbar() {
  const t = useTranslations("nav");
  const tBrand = useTranslations("brand");
  const scrolled = useScrolled();
  const { onHome, goTo } = useSectionNav();
  const active = useActiveSection(sectionIds, onHome);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      {/* Billentyűzetes felhasználóknak: ugrás egyenesen a tartalomra */}
      <a
        href="#tartalom"
        className="sr-only z-[60] rounded-xl bg-base-700 px-4 py-3 text-sm font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {t("skipToContent")}
      </a>

      <header className="fixed inset-x-0 top-0 z-40 h-[var(--nav-h)]">
        {/* Háttérréteg: csak az átlátszósága animálódik → sima 60fps */}
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 border-b bg-base-900/75 backdrop-blur-xl backdrop-saturate-150 transition-[opacity,border-color] duration-500",
            scrolled ? "border-line opacity-100" : "border-transparent opacity-0",
          )}
        />

        <Container className="relative flex h-full items-center justify-between gap-4 lg:grid lg:grid-cols-[1fr_auto_1fr]">
          <Link
            href="/"
            aria-label={tBrand("homeLabel")}
            onClick={(e) => goTo(e, null)}
            className="justify-self-start rounded-lg"
          >
            <Logo size="md" eager />
          </Link>

          {/* Középső menü – csak asztalon */}
          <nav aria-label={t("mainNav")} className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {navSections.map((section) => {
                const isActive = active === section.id;
                return (
                  <li key={section.id}>
                    <Link
                      href={{ pathname: "/", hash: section.id }}
                      onClick={(e) => goTo(e, section.id)}
                      aria-current={isActive ? "location" : undefined}
                      className={cn(
                        "group relative flex h-12 items-center px-4 text-[15px] font-medium transition-colors",
                        isActive ? "text-fg" : "text-muted hover:text-fg",
                      )}
                    >
                      {t(section.labelKey)}
                      {/* Gradiens aláhúzás: aktív szekciónál és hover-re */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute inset-x-4 bottom-2 h-px origin-left bg-brand transition-transform duration-300 ease-[var(--ease-premium)]",
                          isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                        )}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-1 justify-self-end">
            <LanguageDropdown className="hidden lg:block" />
            <Button variant="ghost" href="/bejelentkezes" className="hidden px-4 lg:inline-flex">
              {t("login")}
            </Button>
            <Button href="/regisztracio" className="ml-1 hidden sm:inline-flex">
              {t("start")}
            </Button>

            {/* Hamburger – mobilon és tableten */}
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={t("openMenu")}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="-mr-2 ml-1 flex size-12 items-center justify-center rounded-xl text-fg transition-colors hover:bg-base-700 lg:hidden"
            >
              <Menu className="size-6" aria-hidden="true" />
            </button>
          </div>
        </Container>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={closeMenu}
        active={active}
        returnFocusRef={menuButtonRef}
      />
    </>
  );
}
