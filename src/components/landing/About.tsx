import { useTranslations } from "next-intl";
import { CornerWave } from "@/components/decor/CornerWave";
import { Container } from "@/components/ui/Container";

const values = ["simple", "hungarian", "reliable"] as const;

// KIK VAGYUNK – szöveg-vezérelt: egy állítás, két bekezdés, három elv hajszálvonalakkal
export function About() {
  const t = useTranslations("about");
  const nav = useTranslations("nav");

  return (
    <section id="kik-vagyunk" aria-labelledby="about-title" className="relative overflow-hidden pt-28 pb-24 sm:pt-40 sm:pb-32">
      <CornerWave className="-top-44 -right-40 hidden w-[620px] opacity-50 sm:block" />
      <Container className="relative">
        <p className="text-sm font-semibold text-muted">{nav("about")}</p>
        <div className="mt-5 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
          <h2 id="about-title" className="text-title font-bold text-balance">
            {t("title")}
          </h2>
          <div className="flex flex-col gap-5 text-lead text-pretty lg:pt-2">
            <p className="text-fg">{t("p1")}</p>
            <p className="text-muted">{t("p2")}</p>
          </div>
        </div>

        <dl className="mt-16 grid border-t border-line-strong sm:mt-24 md:grid-cols-3">
          {values.map((key, i) => (
            <div
              key={key}
              className={
                "border-line py-7 md:py-9 md:pr-8 " +
                (i > 0 ? "border-t md:border-t-0 md:border-l md:pl-8" : "")
              }
            >
              <dt className="text-xl font-semibold">{t(`values.${key}.title`)}</dt>
              <dd className="mt-3 leading-relaxed text-muted">{t(`values.${key}.text`)}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
