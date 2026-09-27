"use client";

import { Phone, Play, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { site } from "@/lib/site";

// „Nézd meg működés közben” – natív <dialog>: beépített fókuszkezelés és Esc
export function DemoButton() {
  const t = useTranslations("demo");
  const tHero = useTranslations("hero");
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <Button variant="secondary" size="lg" onClick={() => dialogRef.current?.showModal()}>
        <Play className="size-4 fill-current" aria-hidden="true" />
        {tHero("ctaSecondary")}
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby="demo-title"
        onClick={(e) => e.target === dialogRef.current && dialogRef.current?.close()}
        className="demo-dialog m-auto w-[min(92vw,560px)] rounded-card border border-line-strong bg-base-800 p-0 text-fg shadow-card"
      >
        <div className="relative p-6 sm:p-8">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label={t("close")}
            className="absolute top-3 right-3 flex size-12 items-center justify-center rounded-xl text-muted transition-colors hover:bg-base-700 hover:text-fg"
          >
            <X className="size-5" aria-hidden="true" />
          </button>

          <h2 id="demo-title" className="pr-10 text-2xl font-bold">
            {t("title")}
          </h2>
          <p className="mt-2 text-muted">{t("text")}</p>

          {/* Lejátszó-helyőrző: ide kerül majd a valódi hanganyag / videó */}
          <div className="mt-6 flex items-center gap-4 rounded-2xl border border-line bg-base-900/60 p-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand opacity-60">
              <Play className="size-5 fill-white text-white" aria-hidden="true" />
              <span className="sr-only">{t("play")}</span>
            </span>
            <div className="flex h-10 flex-1 items-center gap-[3px] overflow-hidden" aria-hidden="true">
              {Array.from({ length: 48 }, (_, i) => (
                <span
                  key={i}
                  className="w-[3px] shrink-0 rounded-full bg-muted/40"
                  style={{ height: `${25 + Math.abs(Math.sin(i * 0.9) * 60) + (i % 5) * 3}%` }}
                />
              ))}
            </div>
          </div>
          <p className="mt-3 text-center text-xs font-semibold tracking-[0.14em] text-muted uppercase">
            {t("soon")}
          </p>

          <div className="mt-6 border-t border-line pt-6">
            <p className="text-sm text-muted">{t("callText")}</p>
            <a
              href={site.phoneHref}
              className="mt-3 inline-flex h-12 items-center gap-2 rounded-xl border border-line-strong px-5 font-semibold transition-colors hover:bg-base-700"
            >
              <Phone className="size-4" aria-hidden="true" />
              {site.phone}
            </a>
          </div>
        </div>
      </dialog>
    </>
  );
}
