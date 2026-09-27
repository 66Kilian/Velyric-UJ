import { BarChart3, CalendarCheck, Languages, MessagesSquare, MoonStar, PhoneForwarded } from "lucide-react";
import { useTranslations } from "next-intl";
import { CornerWave } from "@/components/decor/CornerWave";
import { Container } from "@/components/ui/Container";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SpotlightCard } from "./SpotlightCard";

const items = [
  { key: "conversation", icon: MessagesSquare },
  { key: "booking", icon: CalendarCheck },
  { key: "handoff", icon: PhoneForwarded },
  { key: "languages", icon: Languages },
  { key: "allDay", icon: MoonStar },
  { key: "analytics", icon: BarChart3 },
] as const;

// MIT TUD A VELYRIC – 6 feature-kártya
export function Features() {
  const t = useTranslations("features");

  return (
    <section id="mit-tudunk" aria-labelledby="features-title" className="relative overflow-hidden py-28 sm:py-36">
      <CornerWave flip className="hidden sm:block -bottom-24 -left-24 w-[520px] rotate-180 opacity-60 sm:w-[640px]" />
      <Container className="relative">
        <SectionHeading eyebrow={t("eyebrow")} title={<span id="features-title">{t("title")}</span>} />
        <RevealGroup className="mt-14 grid gap-4 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ key, icon: Icon }) => (
            <RevealItem key={key}>
              <SpotlightCard>
                <span className="flex size-12 items-center justify-center rounded-2xl bg-brand shadow-[0_8px_30px_-8px_rgb(229_35_126/0.6)]">
                  <Icon className="size-5 text-white" aria-hidden="true" />
                </span>
                <h3 className="mt-6 text-xl font-semibold">{t(`items.${key}.title`)}</h3>
                <p className="mt-2 leading-relaxed text-muted">{t(`items.${key}.text`)}</p>
              </SpotlightCard>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
