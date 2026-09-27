import { Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import mark from "../../../public/brand/velyric-mark.png";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { site } from "@/lib/site";

// ZÁRÓ CTA – Deep Plum → Pink → Crimson panel (a fehér szöveg mindenhol AA), a V jel óriásban.
// Iparági oldalon saját címet és szöveget kap.
export function FinalCta({ title, text }: { title?: string; text?: string }) {
  const t = useTranslations("cta");

  return (
    <section aria-labelledby="cta-title" className="relative bg-canvas py-24 sm:py-32">
      <Container>
        <div className="relative isolate overflow-hidden rounded-media bg-[linear-gradient(135deg,#8e0069_0%,#c4007a_55%,#d6003f_100%)] px-6 py-20 text-center text-white shadow-lift sm:px-16 sm:py-28">
          <Image
            src={mark}
            alt=""
            sizes="700px"
            className="pointer-events-none absolute -right-24 -bottom-24 -z-10 w-[560px] max-w-none opacity-25 mix-blend-screen sm:-right-10"
          />
          <h2 id="cta-title" className="mx-auto max-w-3xl text-title font-bold text-balance">
            {title ?? t("title")}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lead text-pretty text-[#ffe3f1]">{text ?? t("text")}</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Button href="/regisztracio" size="lg" variant="inverse" className="w-full px-10 sm:w-auto">
              {t("button")}
            </Button>
            <a
              href={site.phoneHref}
              className="inline-flex min-h-12 items-center gap-2 font-medium text-white underline-offset-4 hover:underline"
            >
              <Phone className="size-4" aria-hidden="true" />
              {t("orCall")} <span className="font-semibold">{site.phone}</span>
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
