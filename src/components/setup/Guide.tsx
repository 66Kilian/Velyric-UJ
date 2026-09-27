"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

// Az MI-kísérő: minden lépésnél a korábbi válaszokra építve szól hozzá.
// A szöveg finoman „beíródik” (csökkentett mozgásnál azonnal megjelenik).
export function Guide({ text, thinking = false, className }: { text: string; thinking?: boolean; className?: string }) {
  const t = useTranslations("setup.guide");
  const [shown, setShown] = useState(text);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = requestAnimationFrame(() => setShown(text));
      return () => cancelAnimationFrame(id);
    }
    let i = 0;
    const id = window.setInterval(() => {
      i = Math.min(text.length, i + 2);
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, 16);
    return () => window.clearInterval(id);
  }, [text]);

  return (
    <div className={cn("flex items-start gap-3.5", className)}>
      <Orb active={thinking} />
      <div className="min-w-0 flex-1 rounded-bubble rounded-tl-md border border-line-strong bg-raised/50 px-4 py-3 backdrop-blur">
        <p className="text-xs font-semibold tracking-[0.08em] text-accent-ink uppercase">{t("name")}</p>
        {/* Látható, „gépelt” szöveg; a képernyőolvasó egyben, egyszer kapja meg */}
        <p className="mt-1 min-h-[1.6em] text-[0.95rem] leading-relaxed text-ink/95" aria-hidden="true">
          {thinking ? <span className="text-muted">{t("thinking")}</span> : shown}
        </p>
        <p className="sr-only" aria-live="polite">
          {thinking ? t("thinking") : text}
        </p>
      </div>
    </div>
  );
}

// A Velyric „hangja”: lélegző gradiens gömb (gondolkodás közben gyorsabban pulzál)
export function Orb({ active = false, size = "md" }: { active?: boolean; size?: "md" | "lg" }) {
  return (
    <span aria-hidden="true" className={cn("relative flex shrink-0 items-center justify-center", size === "lg" ? "size-16" : "size-10")}>
      <span className={cn("orb-ring absolute inset-0 rounded-full bg-brand opacity-30 blur-md", active && "orb-ring-fast")} />
      <span className="relative size-full rounded-full bg-[radial-gradient(circle_at_30%_25%,color-mix(in_oklab,var(--pink)_25%,white)_0%,color-mix(in_oklab,var(--pink)_80%,white)_28%,var(--crimson)_62%,color-mix(in_oklab,var(--crimson)_45%,black)_100%)] shadow-[inset_0_-6px_14px_rgb(0_0_0/0.35),0_8px_24px_-8px_color-mix(in_oklab,var(--pink)_60%,transparent)]" />
    </span>
  );
}
