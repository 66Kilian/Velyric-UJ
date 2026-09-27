import { Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import mark from "../../../public/brand/velyric-mark.png";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { site } from "@/lib/site";

// ZÁRÓ CTA – egy erős mondat + „Kezdjük”, gradiens-glow háttérrel
export function FinalCta() {
  const t = useTranslations("cta");

  return (
    <section aria-labelledby="cta-title" className="relative py-28 sm:py-36">
      <Container>
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-[32px] border border-line-strong bg-base-800 px-6 py-20 text-center sm:px-16 sm:py-28">
            {/* Gradiens fény alulról + a V jel óriásban, halványan */}
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10"
              style={{
                background:
                  "radial-gradient(70% 90% at 50% 120%, rgb(229 35 126 / 0.45), rgb(139 47 232 / 0.2) 45%, transparent 75%)",
              }}
            />
            <Image
              src={mark}
              alt=""
              sizes="600px"
              className="pointer-events-none absolute top-1/2 left-1/2 -z-10 w-[640px] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-[0.07]"
            />
            <h2 id="cta-title" className="mx-auto max-w-3xl text-[2.25rem] leading-[1.08] font-bold tracking-[-0.02em] text-balance sm:text-6xl">
              {t("title")}
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-pretty text-muted">{t("text")}</p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
              <Button href="/regisztracio" size="lg" className="w-full px-10 sm:w-auto">
                {t("button")}
              </Button>
              <a
                href={site.phoneHref}
                className="inline-flex h-12 items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-fg"
              >
                <Phone className="size-4" aria-hidden="true" />
                {t("orCall")} <span className="font-semibold text-fg">{site.phone}</span>
              </a>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
