import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";

// 404: mi történt + mit tehetsz (a státuszkód valódi 404)
export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <main className="flex min-h-dvh flex-col items-start justify-center gap-6 px-5 sm:px-12 lg:px-24">
      <Link href="/" aria-label="Velyric" className="mb-6 rounded-lg">
        <Logo />
      </Link>
      <p className="tabular text-sm font-semibold text-muted">404</p>
      <h1 className="max-w-2xl text-title font-bold text-balance">{t("title")}</h1>
      <p className="max-w-xl text-lead text-muted">{t("text")}</p>
      <Button href="/" size="lg">
        {t("cta")}
      </Button>
    </main>
  );
}
