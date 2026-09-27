import { HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { CornerWave } from "@/components/decor/CornerWave";
import { Container } from "@/components/ui/Container";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/ui/SectionHeading";

const values = [
  { key: "simple", icon: Sparkles },
  { key: "hungarian", icon: HeartHandshake },
  { key: "reliable", icon: ShieldCheck },
] as const;

// KIK VAGYUNK – rövid, magabiztos bemutatkozás + 3 érték-kártya
export function About() {
  const t = useTranslations("about");

  return (
    <section id="kik-vagyunk" aria-labelledby="about-title" className="relative overflow-hidden py-28 sm:py-36">
      <CornerWave className="hidden sm:block -top-10 -right-24 w-[520px] opacity-70 sm:w-[680px]" />
      <Container className="relative grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <Reveal className="flex flex-col gap-6">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h2 id="about-title" className="text-[2rem] leading-[1.1] font-bold tracking-[-0.02em] text-balance sm:text-5xl">
            {t("title")}
          </h2>
        </Reveal>
        <Reveal delay={0.1} className="flex flex-col gap-5 text-lg leading-relaxed text-pretty text-muted lg:pt-10">
          <p className="text-fg">{t("p1")}</p>
          <p>{t("p2")}</p>
        </Reveal>
      </Container>

      <Container>
        <RevealGroup className="mt-16 grid gap-4 sm:mt-20 md:grid-cols-3">
          {values.map(({ key, icon: Icon }) => (
            <RevealItem key={key}>
              <div className="group h-full rounded-card border border-line bg-base-800/60 p-7 shadow-card transition-colors duration-300 hover:border-line-strong">
                <span className="flex size-12 items-center justify-center rounded-2xl border-brand">
                  <Icon className="size-5 text-brand-pink" aria-hidden="true" />
                </span>
                <h3 className="mt-6 text-xl font-semibold">{t(`values.${key}.title`)}</h3>
                <p className="mt-2 leading-relaxed text-muted">{t(`values.${key}.text`)}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
