import { ArrowUpRight, Check, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { CallPlayback, type Turn } from "@/components/landing/CallPlayback";
import { FinalCta } from "@/components/landing/FinalCta";
import { Personal } from "@/components/landing/Personal";
import { JsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { MediaReveal } from "@/components/ui/Reveal";
import { getPathname, Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { INDUSTRIES, getIndustry, type IndustryKey } from "@/lib/industries";
import { site } from "@/lib/site";

const PAINS = ["a", "b", "c"] as const;
const SOLVES = ["a", "b", "c", "d"] as const;

// Iparági megoldás-oldal: az ő hívásaik, gondjaik, és amit a Velyric náluk megold.
// Egy sablon, négy iparág – minden szöveg, kép és példahívás iparág-specifikus.
export async function IndustryPage({ industry, locale }: { industry: IndustryKey; locale: Locale }) {
  const t = await getTranslations("industries");
  const tNav = await getTranslations("nav");
  const tCall = await getTranslations("call");
  const data = getIndustry(industry);

  const turns: Turn[] = [
    { who: "caller", text: t(`${industry}.call.t1`) },
    { who: "agent", text: t(`${industry}.call.t2`) },
    { who: "caller", text: t(`${industry}.call.t3`) },
    { who: "agent", text: t(`${industry}.call.t4`) },
  ];
  const typical = t.raw(`${industry}.typical`) as string[];

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: site.name, item: `${site.url}${getPathname({ locale, href: "/" })}` },
      {
        "@type": "ListItem",
        position: 2,
        name: t(`${industry}.name`),
        item: `${site.url}${getPathname({ locale, href: data.href })}`,
      },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbs} />

      {/* ---- Iparági hero ---- */}
      <section
        aria-labelledby="industry-title"
        className="relative overflow-hidden bg-[radial-gradient(60%_60%_at_80%_25%,rgba(255,0,122,0.2)_0%,rgba(142,0,105,0.12)_40%,rgba(7,19,39,0)_75%)] bg-canvas pt-[calc(var(--nav-h)+3rem)] pb-20 sm:pb-28"
      >
        <Container className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <nav aria-label="Breadcrumb" className="text-sm text-muted">
              <Link href={{ pathname: "/", hash: "megoldasok" }} className="font-medium hover:text-ink">
                {t("page.all")}
              </Link>
              <span aria-hidden="true"> / </span>
              <span aria-current="page">{t(`${industry}.name`)}</span>
            </nav>
            <p className="rise-in mt-8 text-xs font-semibold tracking-[0.16em] text-accent-ink uppercase">
              {t(`${industry}.kicker`)}
            </p>
            <h1 id="industry-title" className="mt-5 text-[clamp(2.4rem,1.3rem+3.2vw,4.1rem)] leading-[1.04] font-bold tracking-[-0.035em] text-balance">
              <span className="line-reveal">
                <span>{t(`${industry}.title`)}</span>
              </span>
            </h1>
            <p className="rise-in mt-6 max-w-xl text-lead text-pretty text-muted [animation-delay:200ms]">
              {t(`${industry}.text`)}
            </p>
            <div className="rise-in mt-9 flex flex-col gap-3 [animation-delay:300ms] sm:flex-row sm:items-center">
              <Button href="/regisztracio" size="lg">
                {tNav("start")}
              </Button>
              <a
                href={site.phoneHref}
                className="inline-flex min-h-12 items-center gap-2 px-2 font-semibold text-ink underline-offset-4 hover:underline"
              >
                <Phone className="size-4 text-accent-ink" aria-hidden="true" />
                {site.phone}
              </a>
            </div>
          </div>

          <div className="relative pb-40 sm:pb-24 lg:pb-0">
            <MediaReveal className="relative aspect-[4/3] overflow-hidden rounded-media shadow-lift lg:ml-10 lg:aspect-[4/5]">
              <Image
                src={data.images[0]}
                alt={t(`${industry}.img1Alt`)}
                placeholder="blur"
                preload
                sizes="(min-width: 1280px) 640px, (min-width: 1024px) 50vw, 92vw"
                className="h-full w-full object-cover"
              />
            </MediaReveal>
            <CallPlayback
              className="absolute bottom-0 left-4 w-[min(88%,21rem)] sm:left-6 lg:-bottom-10 lg:-left-6"
              business={t(`${industry}.call.business`)}
              turns={turns}
              outcome={{ kind: "booked", text: t(`${industry}.call.outcome`) }}
            />
          </div>
        </Container>
      </section>

      {/* ---- Ismerős? ---- */}
      <section aria-labelledby="pains-title" className="bg-canvas py-24 sm:py-28">
        <Container>
          <h2 id="pains-title" className="text-title font-bold">
            {t("page.painsTitle")}
          </h2>
          <ul className="mt-12 grid gap-5 md:grid-cols-3">
            {PAINS.map((p) => (
              <li key={p} className="rounded-panel border border-line bg-band p-7">
                <span aria-hidden="true" className="block h-1 w-10 rounded-full bg-brand" />
                <h3 className="mt-6 text-xl font-semibold">{t(`${industry}.pains.${p}.title`)}</h3>
                <p className="mt-2 leading-relaxed text-muted">{t(`${industry}.pains.${p}.text`)}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* ---- Így dolgozik nálatok ---- */}
      <section aria-labelledby="solves-title" className="bg-band py-24 sm:py-28">
        <Container className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="lg:sticky lg:top-[calc(var(--nav-h)+2rem)]">
            <h2 id="solves-title" className="text-title font-bold text-balance">
              {t("page.solvesTitle")}
            </h2>
            <MediaReveal className="mt-10 aspect-[4/3] overflow-hidden rounded-media">
              <Image
                src={data.images[1]}
                alt={t(`${industry}.img2Alt`)}
                placeholder="blur"
                sizes="(min-width: 1280px) 600px, (min-width: 1024px) 46vw, 92vw"
                className="h-full w-full object-cover"
              />
            </MediaReveal>
          </div>
          <ol className="flex flex-col gap-4 lg:pt-4">
            {SOLVES.map((s, i) => (
              <li key={s} className="grid grid-cols-[2.75rem_1fr] gap-5 rounded-panel bg-surface p-6 shadow-float sm:p-7">
                <span className="tabular flex size-11 items-center justify-center rounded-xl bg-cta text-sm font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{t(`${industry}.solves.${s}.title`)}</h3>
                  <p className="mt-1.5 leading-relaxed text-muted">{t(`${industry}.solves.${s}.text`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ---- Amiről a legtöbben telefonálnak ---- */}
      <section aria-labelledby="typical-title" className="bg-canvas py-20 sm:py-24">
        <Container>
          <h2 id="typical-title" className="max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
            {t("page.typicalTitle")}
          </h2>
          <ul className="mt-8 flex flex-wrap gap-3">
            {typical.map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-4 py-2.5 text-ui font-medium"
              >
                <Check className="size-4 text-success" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted">{tCall("example")}: {t(`${industry}.call.business`)}</p>
        </Container>
      </section>

      <Personal />
      <FinalCta title={t(`${industry}.ctaTitle`)} text={t(`${industry}.ctaText`)} />

      {/* ---- Más iparágak ---- */}
      <section aria-labelledby="others-title" className="bg-canvas pb-24">
        <Container>
          <h2 id="others-title" className="text-lg font-semibold">
            {t("page.others")}
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-3">
            {INDUSTRIES.filter((i) => i.key !== industry).map((other) => (
              <li key={other.key}>
                <Link
                  href={other.href}
                  className="group flex min-h-16 items-center justify-between rounded-panel border border-line bg-surface px-5 font-semibold transition-colors hover:border-line-strong hover:bg-band"
                >
                  {t(`${other.key}.name`)}
                  <ArrowUpRight className="size-4 text-accent-ink transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
