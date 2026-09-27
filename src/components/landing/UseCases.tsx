import { useTranslations } from "next-intl";
import Image, { type StaticImageData } from "next/image";
import cafe from "@/assets/images/kavezo.jpg";
import clinic from "@/assets/images/rendelo.jpg";
import salon from "@/assets/images/szalon.jpg";
import service from "@/assets/images/szerviz.jpg";
import { Container } from "@/components/ui/Container";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const items: { key: "salon" | "clinic" | "cafe" | "service"; img: StaticImageData }[] = [
  { key: "salon", img: salon },
  { key: "clinic", img: clinic },
  { key: "cafe", img: cafe },
  { key: "service", img: service },
];

// KINEK SZÓL – képes kártyák tipikus hívásokkal
export function UseCases() {
  const t = useTranslations("useCases");

  return (
    <section aria-labelledby="usecases-title" className="relative border-y border-line bg-base-800/40 py-28 sm:py-36">
      <Container>
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={<span id="usecases-title">{t("title")}</span>}
          text={t("text")}
        />
        <RevealGroup className="mt-14 grid gap-4 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ key, img }) => (
            <RevealItem key={key}>
              <article className="group relative aspect-[4/5] overflow-hidden rounded-card border border-line-strong lg:aspect-[3/4.4]">
                <Image
                  src={img}
                  alt={t(`items.${key}.alt`)}
                  placeholder="blur"
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 90vw"
                  className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-premium)] group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-base-900 via-base-900/40 to-base-900/10" />
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-6">
                  <p className="self-start rounded-2xl rounded-bl-md border border-white/10 bg-base-900/70 px-3.5 py-2.5 text-sm leading-snug text-fg/90 backdrop-blur-md">
                    {t(`items.${key}.quote`)}
                  </p>
                  <h3 className="text-xl font-semibold">{t(`items.${key}.title`)}</h3>
                </div>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
