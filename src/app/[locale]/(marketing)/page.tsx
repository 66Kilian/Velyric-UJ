import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { routing } from "@/i18n/routing";
import { navSections } from "@/lib/site";

// IDEIGLENES előnézet (1. lépés): a design rendszer ellenőrzésére.
// A 2–4. lépésben ezt váltja a Navbar + Hero + szekciók.
const swatches = [
  { name: "--bg-900", hex: "#050409" },
  { name: "--bg-800", hex: "#0b0913" },
  { name: "--bg-700", hex: "#141020" },
  { name: "--text", hex: "#F4F1F8" },
  { name: "--muted", hex: "#A49DBA" },
];

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (hasLocale(routing.locales, locale)) setRequestLocale(locale);

  const t = await getTranslations("preview");
  const nav = await getTranslations("nav");

  return (
    <>
      <Container className="flex flex-col gap-16 pt-[calc(var(--nav-h)+3rem)] pb-16">

        <section className="flex max-w-3xl flex-col items-start gap-6">
          <span className="rounded-full border border-line-strong px-3 py-1 text-xs font-semibold tracking-[0.14em] text-muted uppercase">
            {t("badge")}
          </span>
          <h1 className="text-display font-bold">
            {t("title").split(" ").slice(0, -2).join(" ")}{" "}
            <span className="text-brand">{t("title").split(" ").slice(-2).join(" ")}</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted">{t("text")}</p>
          <div className="flex flex-wrap gap-3">
            <Button href="/regisztracio" size="lg">
              {nav("start")}
            </Button>
            <Button variant="secondary" size="lg">
              {t("secondary")}
            </Button>
            <Button variant="secondary" size="lg" loading>
              {t("loadingButton")}
            </Button>
            <Button variant="ghost" href="/bejelentkezes">
              {nav("login")}
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold tracking-[0.14em] text-muted uppercase">
            {t("colors")}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {swatches.map((s) => (
              <div key={s.name} className="rounded-card border border-line p-3 shadow-card">
                <div className="h-16 rounded-xl border border-line" style={{ background: s.hex }} />
                <p className="mt-3 text-sm font-semibold">{s.name}</p>
                <p className="text-xs text-muted">{s.hex}</p>
              </div>
            ))}
            <div className="border-brand rounded-card p-3">
              <div className="bg-brand h-16 rounded-xl" />
              <p className="mt-3 text-sm font-semibold">Brand</p>
              <p className="text-xs text-muted">135° gradiens</p>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-8">
          <Logo size="sm" />
          <Logo size="lg" />
          <Logo size="lg" withWordmark={false} />
        </div>
      </Container>

      {/* Helyőrző szekciók a navbar teszteléséhez (görgetés, aktív menüpont) */}
      {navSections.map((section, i) => (
        <Container
          as="section"
          key={section.id}
          id={section.id}
          className={i === navSections.length - 1 ? "py-16" : "py-24"}
        >
          <div
            className={
              "flex flex-col justify-center gap-3 rounded-card border border-dashed border-line-strong p-8 " +
              (i === navSections.length - 1 ? "min-h-[40vh]" : "min-h-[90vh]")
            }
          >
            <h2 className="text-3xl font-bold">{nav(section.labelKey)}</h2>
            <p className="text-muted">{t("placeholder")}</p>
          </div>
        </Container>
      ))}
    </>
  );
}
