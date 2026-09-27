import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import meeting from "@/assets/images/szemelyes.jpg";
import { Container } from "@/components/ui/Container";
import { MediaReveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const steps = ["visit", "tailor", "launch"] as const;

// SZEMÉLYESEN – kimegyünk, felmérünk, testreszabunk, élesítünk (valódi sorrend → számozott)
export function Personal() {
  const t = useTranslations("personal");

  return (
    <section aria-labelledby="personal-title" className="relative bg-blush py-24 sm:py-32">
      <Container className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <figure>
          <MediaReveal className="relative aspect-[4/5] overflow-hidden rounded-media shadow-lift sm:aspect-square">
            <Image
              src={meeting}
              alt={t("imageAlt")}
              placeholder="blur"
              sizes="(min-width: 1280px) 600px, (min-width: 1024px) 46vw, 92vw"
              className="h-full w-full object-cover"
            />
          </MediaReveal>
          <figcaption className="mt-4 flex items-center gap-2 text-sm text-muted">
            <MapPin className="size-4 shrink-0 text-accent-ink" aria-hidden="true" />
            <span>
              <span className="font-semibold text-ink">{t("badgeTitle")}</span> – {t("badgeText")}
            </span>
          </figcaption>
        </figure>

        <div>
          <SectionHeading id="personal-title" label={t("eyebrow")} title={t("title")} text={t("text")} />
          <ol className="mt-10 flex flex-col">
            {steps.map((key, i) => (
              <li key={key} className="grid grid-cols-[2.5rem_1fr] gap-4 border-t border-line-strong py-6 last:pb-0">
                <span className="tabular flex size-9 items-center justify-center rounded-full bg-cta text-sm font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{t(`steps.${key}.title`)}</h3>
                  <p className="mt-1.5 leading-relaxed text-muted">{t(`steps.${key}.text`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
