import { Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { site } from "@/lib/site";

// Jogi oldal váza. A végleges szöveg még hiányzik → egyértelmű „előkészítés alatt” jelzés,
// kitalált jogi szöveg helyett. (Tulajdonosi teendő: a végleges dokumentum feltöltése.)
export function LegalDraft({ kind }: { kind: "privacy" | "terms" }) {
  const t = useTranslations("legal");
  return (
    <Container className="max-w-3xl pt-[calc(var(--nav-h)+4rem)] pb-28">
      <h1 className="text-title font-bold text-balance">{t(kind)}</h1>
      <div className="mt-10 border-t border-line-strong pt-8">
        <p className="text-lg font-semibold">{t("draftTitle")}</p>
        <p className="mt-3 text-lead text-pretty text-muted">{t("draftText")}</p>
        <a
          href={site.phoneHref}
          className="mt-6 inline-flex min-h-12 items-center gap-2 font-semibold underline-offset-4 hover:underline"
        >
          <Phone className="size-4" aria-hidden="true" />
          {site.phone}
        </a>
      </div>
    </Container>
  );
}
