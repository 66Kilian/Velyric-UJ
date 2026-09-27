"use client";

import { AnimatePresence, m } from "framer-motion";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeNames } from "@/i18n/locales";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import { DURATION, EASE_OUT } from "@/lib/motion";

// Nyelvváltás: ugyanazon az oldalon marad, csak a nyelv (és a beszédes URL) változik
function useSwitchLocale() {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  // scroll: false → a görgetési pozíció megmarad, csak a szöveg cserélődik
  const switchTo = (locale: Locale) => {
    startTransition(() => {
      router.replace(pathname, { locale, scroll: false });
    });
  };

  return { switchTo, pending };
}

// Asztali változat: kis legördülő a navbar jobb oldalán
export function LanguageDropdown({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const current = useLocale();
  const { switchTo, pending } = useSwitchLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  // Bezárás kattintásra kívül és Esc-re
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${t("language")}: ${localeNames[current]}`}
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-muted transition-colors hover:text-ink"
      >
        <Globe className="size-4" aria-hidden="true" />
        <span className="uppercase">{current}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn("size-4 transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <m.ul
            id={listId}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: DURATION.overlay, ease: EASE_OUT }}
            className="absolute top-full right-0 mt-2 w-48 rounded-xl border border-line-strong bg-surface/95 p-1.5 shadow-float backdrop-blur-xl"
          >
            {routing.locales.map((locale) => {
              const selected = locale === current;
              return (
                <li key={locale}>
                  <button
                    type="button"
                    lang={locale}
                    aria-current={selected || undefined}
                    disabled={pending}
                    onClick={() => {
                      setOpen(false);
                      if (!selected) switchTo(locale);
                    }}
                    className={cn(
                      "flex h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-medium transition-colors",
                      selected ? "bg-blush-deep text-ink" : "text-muted hover:bg-blush-deep/60 hover:text-ink",
                    )}
                  >
                    {localeNames[locale]}
                    {selected && <Check className="size-4 text-accent-ink" aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </m.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// Mobil változat: három nagy, egymás melletti gomb a menü alján
export function LanguageSegmented({ className }: { className?: string }) {
  const t = useTranslations("nav");
  const current = useLocale();
  const { switchTo, pending } = useSwitchLocale();

  return (
    <div role="group" aria-label={t("language")} className={cn("grid grid-cols-3 gap-2", className)}>
      {routing.locales.map((locale) => {
        const selected = locale === current;
        return (
          <button
            key={locale}
            type="button"
            lang={locale}
            aria-pressed={selected}
            disabled={pending}
            onClick={() => !selected && switchTo(locale)}
            className={cn(
              "h-12 rounded-xl border text-sm font-semibold transition-colors",
              selected
                ? "border-brand text-ink"
                : "border-line-strong text-muted hover:border-ink/25 hover:text-ink",
            )}
          >
            {localeNames[locale]}
          </button>
        );
      })}
    </div>
  );
}
