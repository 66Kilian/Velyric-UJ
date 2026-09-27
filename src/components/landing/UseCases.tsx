"use client";

import { CalendarCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import Image, { type StaticImageData } from "next/image";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import cafe from "@/assets/images/kavezo.jpg";
import clinic from "@/assets/images/rendelo.jpg";
import salon from "@/assets/images/szalon.jpg";
import service from "@/assets/images/szerviz.jpg";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";

type Key = "salon" | "clinic" | "cafe" | "service";
const items: { key: Key; img: StaticImageData }[] = [
  { key: "salon", img: salon },
  { key: "clinic", img: clinic },
  { key: "cafe", img: cafe },
  { key: "service", img: service },
];

// KINEK SZÓL – iparág-fülek: mindegyik a saját fotóját és egy tipikus rövid hívását mutatja.
// Akadálymentes tablist: nyilakkal, Home/End-del is váltható.
export function UseCases() {
  const t = useTranslations("useCases");
  const tc = useTranslations("call");
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();

  const select = (i: number) => {
    setActive(i);
    tabRefs.current[i]?.focus();
  };
  const onKeyDown = (e: KeyboardEvent) => {
    const last = items.length - 1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") select(active === last ? 0 : active + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") select(active === 0 ? last : active - 1);
    else if (e.key === "Home") select(0);
    else if (e.key === "End") select(last);
    else return;
    e.preventDefault();
  };

  const current = items[active];

  return (
    <section aria-labelledby="usecases-title" className="relative py-24 sm:py-32">
      <Container>
        <SectionHeading id="usecases-title" label={t("eyebrow")} title={t("title")} text={t("text")} />

        <div className="mt-12 grid gap-8 sm:mt-16 lg:grid-cols-[18rem_1fr] lg:gap-12">
          {/* Fülek */}
          <div
            role="tablist"
            aria-label={t("tabsLabel")}
            aria-orientation="vertical"
            onKeyDown={onKeyDown}
            className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0 lg:flex-col lg:overflow-visible"
          >
            {items.map(({ key }, i) => (
              <button
                key={key}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${key}`}
                aria-selected={active === i}
                aria-controls={`${baseId}-panel`}
                tabIndex={active === i ? 0 : -1}
                onClick={() => setActive(i)}
                className={cn(
                  "flex min-h-12 shrink-0 items-center gap-3 rounded-xl px-4 text-left text-ui font-semibold transition-colors duration-150",
                  active === i ? "bg-base-600 text-fg" : "text-muted hover:bg-base-800 hover:text-fg",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn("h-5 w-1 rounded-full bg-brand transition-opacity", active === i ? "opacity-100" : "opacity-0")}
                />
                {t(`items.${key}.title`)}
              </button>
            ))}
          </div>

          {/* Panel: fotó + tipikus hívás */}
          <div
            role="tabpanel"
            id={`${baseId}-panel`}
            aria-labelledby={`${baseId}-tab-${current.key}`}
            className="grid overflow-hidden rounded-media border border-line-strong bg-base-800 md:grid-cols-[1.1fr_1fr]"
          >
            <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[26rem]">
              {items.map(({ key, img }, i) => (
                <Image
                  key={key}
                  src={img}
                  alt={t(`items.${key}.alt`)}
                  placeholder="blur"
                  sizes="(min-width: 1280px) 480px, (min-width: 1024px) 40vw, (min-width: 768px) 55vw, 100vw"
                  aria-hidden={active !== i}
                  className={cn(
                    "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
                    active === i ? "opacity-100" : "opacity-0",
                  )}
                />
              ))}
            </div>
            <div key={current.key} className="flex flex-col justify-center gap-3 p-6 text-ui leading-snug sm:p-8">
              <p className="text-xs font-medium text-muted">{tc("example")}</p>
              <p className="turn-in max-w-[92%] self-start rounded-bubble rounded-bl-md bg-base-600 px-4 py-3">
                <span className="sr-only">{tc("caller")}: </span>
                {t(`items.${current.key}.quote`)}
              </p>
              <p className="turn-in max-w-[92%] self-end rounded-bubble rounded-br-md border border-brand-pink/35 bg-brand-pink/10 px-4 py-3 [animation-delay:120ms]">
                <span className="sr-only">{tc("agent")}: </span>
                {t(`items.${current.key}.agent`)}
              </p>
              <p className="turn-in mt-2 flex items-center gap-2 text-sm font-medium text-success [animation-delay:240ms]">
                <CalendarCheck className="size-4 shrink-0" aria-hidden="true" />
                {t(`items.${current.key}.outcome`)}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
