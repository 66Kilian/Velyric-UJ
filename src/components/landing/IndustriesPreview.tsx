"use client";

import { m } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { INDUSTRIES } from "@/lib/industries";
import { EASE_OUT } from "@/lib/motion";

// MEGOLDÁSOK – négy iparág, mindegyik a saját, rá szabott oldalára visz
export function IndustriesPreview() {
  const t = useTranslations("industries");

  return (
    <section id="megoldasok" aria-labelledby="industries-title" className="relative bg-canvas py-24 sm:py-32">
      <Container>
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-accent-ink">{t("label")}</p>
            <h2 id="industries-title" className="mt-4 text-title font-bold text-balance">
              {t("title")}
            </h2>
          </div>
          <p className="max-w-xl text-lead text-pretty text-muted lg:justify-self-end">{t("text")}</p>
        </div>

        <m.ul
          className="mt-14 grid gap-5 sm:mt-16 md:grid-cols-2"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        >
          {INDUSTRIES.map(({ key, href, images }) => (
            <m.li
              key={key}
              variants={{
                hidden: { opacity: 0, y: 28 },
                show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT } },
              }}
            >
              <Link
                href={href}
                className="group flex h-full flex-col overflow-hidden rounded-media border border-line bg-surface shadow-float transition-shadow duration-300 hover:shadow-lift"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={images[0]}
                    alt={t(`${key}.img1Alt`)}
                    placeholder="blur"
                    sizes="(min-width: 1280px) 600px, (min-width: 768px) 48vw, 92vw"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-6 sm:p-8">
                  <h3 className="text-2xl font-bold tracking-tight">{t(`${key}.name`)}</h3>
                  <p className="leading-relaxed text-muted">{t(`${key}.card`)}</p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-2 font-semibold text-accent-ink">
                    {t("open")}
                    <ArrowUpRight
                      className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </Link>
            </m.li>
          ))}
        </m.ul>
      </Container>
    </section>
  );
}
