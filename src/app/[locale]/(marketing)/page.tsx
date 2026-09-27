import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { About } from "@/components/landing/About";
import { Features } from "@/components/landing/Features";
import { FinalCta } from "@/components/landing/FinalCta";
import { HeroStory } from "@/components/landing/HeroStory";
import { Personal } from "@/components/landing/Personal";
import { UseCases } from "@/components/landing/UseCases";
import { routing } from "@/i18n/routing";

// A landing oldal: Hero + „Így dolgozik” (3D logó) → Kik vagyunk → Személyesen
// → Mit tud → Kinek szól → Záró CTA (a footer a layoutban)
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (hasLocale(routing.locales, locale)) setRequestLocale(locale);

  return (
    <>
      <HeroStory />
      <About />
      <Personal />
      <Features />
      <UseCases />
      <FinalCta />
    </>
  );
}
