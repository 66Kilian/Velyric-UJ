import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import meeting from "@/assets/images/szemelyes.jpg";
import { Container } from "@/components/ui/Container";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const steps = ["visit", "tailor", "launch"] as const;

// SZEMÉLYESEN – kimegyünk, felmérünk, testreszabunk, élesítünk
export function Personal() {
  const t = useTranslations("personal");

  return (
    <section aria-labelledby="personal-title" className="relative border-y border-line bg-base-800/40 py-28 sm:py-36">
      <Container className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
        <Reveal className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] border border-line-strong sm:aspect-[5/5]">
            <Image
              src={meeting}
              alt={t("imageAlt")}
              placeholder="blur"
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-base-900/70 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgb(139_47_232/0.18),transparent_45%,rgb(255_122_60/0.12))] mix-blend-soft-light" />
          </div>
          {/* Lebegő jelvény */}
          <div className="absolute -bottom-6 left-6 flex items-center gap-3 rounded-2xl border border-line-strong bg-base-900/85 px-4 py-3 shadow-soft backdrop-blur-xl sm:left-auto sm:-right-6">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand">
              <MapPin className="size-5 text-white" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">{t("badgeTitle")}</p>
              <p className="text-xs text-muted">{t("badgeText")}</p>
            </div>
          </div>
        </Reveal>

        <div className="flex flex-col gap-12">
          <SectionHeading eyebrow={t("eyebrow")} title={<span id="personal-title">{t("title")}</span>} text={t("text")} />
          <RevealGroup className="relative flex flex-col gap-8">
            <span aria-hidden="true" className="absolute top-2 bottom-2 left-[19px] w-px bg-gradient-to-b from-brand-violet via-brand-pink to-brand-orange opacity-40" />
            {steps.map((key, i) => (
              <RevealItem key={key} className="relative flex gap-5">
                <span className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-brand text-sm font-bold">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{t(`steps.${key}.title`)}</h3>
                  <p className="mt-1.5 leading-relaxed text-muted">{t(`steps.${key}.text`)}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </Container>
    </section>
  );
}
