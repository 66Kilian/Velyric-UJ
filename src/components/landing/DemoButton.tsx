"use client";

import { Phone, Play, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { site } from "@/lib/site";
import { CallPlayback, type Turn } from "./CallPlayback";

// „Nézd meg működés közben” – natív <dialog> (beépített fókuszkezelés, Esc),
// benne egy lejátszódó, egyértelműen példaként jelölt hívás
export function DemoButton() {
  const t = useTranslations("demo");
  const tHero = useTranslations("hero");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  const turns = useMemo<Turn[]>(
    () => [
      { who: "caller", text: t("t1") },
      { who: "agent", text: t("t2") },
      { who: "caller", text: t("t3") },
      { who: "agent", text: t("t4") },
    ],
    [t],
  );

  const close = () => dialogRef.current?.close();

  return (
    <>
      <Button
        variant="secondary"
        size="lg"
        onClick={() => {
          setOpen(true);
          dialogRef.current?.showModal();
        }}
      >
        <Play className="size-4 fill-current" aria-hidden="true" />
        {tHero("ctaSecondary")}
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby="demo-title"
        aria-describedby="demo-text"
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === dialogRef.current && close()}
        className="dialog-panel m-auto w-[min(94vw,560px)] rounded-panel border border-line-strong bg-base-900 p-0 text-fg shadow-float"
      >
        <div className="relative p-5 sm:p-7">
          <button
            type="button"
            onClick={close}
            aria-label={t("close")}
            className="absolute top-3 right-3 flex size-12 items-center justify-center rounded-xl text-muted transition-colors hover:bg-base-700 hover:text-fg"
          >
            <X className="size-5" aria-hidden="true" />
          </button>

          <h2 id="demo-title" className="pr-12 text-2xl font-bold tracking-tight">
            {t("title")}
          </h2>
          <p id="demo-text" className="mt-2 pr-4 text-muted">
            {t("text")}
          </p>

          {/* Csak nyitott ablakban él (így mindig az elejéről indul) */}
          {open && (
            <CallPlayback
              className="mt-6"
              business={t("business")}
              turns={turns}
              outcome={{ kind: "handoff", text: t("handoff") }}
            />
          )}
          <p className="mt-3 text-xs text-muted">{t("note")}</p>

          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-5 text-sm">
            <span className="text-muted">{t("callText")}</span>
            <a
              href={site.phoneHref}
              className="inline-flex min-h-11 items-center gap-2 font-semibold underline-offset-4 hover:underline"
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
