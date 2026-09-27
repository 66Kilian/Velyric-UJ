import { BarChart3, CalendarCheck, Languages, MessagesSquare, MoonStar, PhoneForwarded, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";

const items: { key: "conversation" | "booking" | "languages" | "handoff" | "allDay" | "analytics"; icon: LucideIcon }[] = [
  { key: "conversation", icon: MessagesSquare },
  { key: "booking", icon: CalendarCheck },
  { key: "languages", icon: Languages },
  { key: "handoff", icon: PhoneForwarded },
  { key: "allDay", icon: MoonStar },
  { key: "analytics", icon: BarChart3 },
];

// MIT TUD A VELYRIC – egy hívás idővonala; minden képesség ott jelenik meg, ahol dolgozik.
// (A 6 képesség: ikon + cím + egy mondat, a hívás egy pillanatához kötve.)
export function Features() {
  const t = useTranslations("features");

  return (
    <section id="mit-tudunk" aria-labelledby="features-title" className="relative py-24 sm:py-32">
      <Container>
        <SectionHeading id="features-title" label={t("eyebrow")} title={t("title")} text={t("intro")} />

        <ol className="mt-14 border-t border-line-strong sm:mt-20">
          {items.map(({ key, icon: Icon }) => {
            const who = t(`lines.${key}.who`) as "agent" | "caller" | "summary";
            const time = t(`lines.${key}.time`);
            return (
              <li
                key={key}
                className="grid gap-5 border-b border-line py-8 md:grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,1fr)] md:gap-8 md:py-10"
              >
                {/* Időbélyeg a hívásban */}
                <p className="tabular text-sm font-medium text-muted md:pt-3">{time || t("after")}</p>

                {/* A hívás pillanata */}
                <div className="md:order-none order-last">
                  <p className="mb-2 text-xs font-medium text-muted">{t(`speaker.${who}`)}</p>
                  <p
                    className={cn(
                      "max-w-md rounded-xl px-4 py-3 text-ui leading-snug",
                      who === "caller" && "rounded-bl-md bg-base-600",
                      who === "agent" && "rounded-br-md border border-brand-pink/35 bg-brand-pink/10",
                      who === "summary" && "border border-line-strong bg-base-800",
                    )}
                  >
                    {t(`lines.${key}.line`)}
                  </p>
                </div>

                {/* A képesség */}
                <div className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-base-700">
                    <Icon className="size-5 text-fg" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">{t(`items.${key}.title`)}</h3>
                    <p className="mt-1.5 leading-relaxed text-muted">{t(`items.${key}.text`)}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}
