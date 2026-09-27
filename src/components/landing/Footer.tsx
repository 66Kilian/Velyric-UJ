import { Globe, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { navSections, site } from "@/lib/site";

// FOOTER – egyben a „Kapcsolat” szekció (a navbar ide görget)
export function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");
  const year = new Date().getFullYear();

  const linkClass = "text-muted transition-colors hover:text-fg";

  return (
    <footer id="kapcsolat" aria-labelledby="footer-title" className="relative border-t border-line bg-base-800/60">
      <h2 id="footer-title" className="sr-only">
        {t("contact")}
      </h2>
      <Container className="grid gap-12 py-16 sm:py-20 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-5">
          <Logo size="md" />
          <p className="max-w-xs leading-relaxed text-muted">{t("tagline")}</p>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold tracking-[0.14em] uppercase">{t("contact")}</h3>
          <a href={site.phoneHref} className={`flex items-center gap-2 ${linkClass}`}>
            <Phone className="size-4" aria-hidden="true" />
            {site.phone}
          </a>
          <a href={site.url} className={`flex items-center gap-2 ${linkClass}`}>
            <Globe className="size-4" aria-hidden="true" />
            {site.domain}
          </a>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold tracking-[0.14em] uppercase">{t("pages")}</h3>
          {navSections.slice(0, 2).map((s) => (
            <Link key={s.id} href={{ pathname: "/", hash: s.id }} className={linkClass}>
              {nav(s.labelKey)}
            </Link>
          ))}
          <Link href="/bejelentkezes" className={linkClass}>
            {nav("login")}
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold tracking-[0.14em] uppercase">{t("legal")}</h3>
          <Link href="/adatvedelem" className={linkClass}>
            {t("privacy")}
          </Link>
          <Link href="/aszf" className={linkClass}>
            {t("terms")}
          </Link>
        </div>
      </Container>
      <Container>
        <div className="flex flex-col gap-2 border-t border-line py-6 text-sm text-muted sm:flex-row sm:justify-between">
          <p>
            © {year} {site.name}. {t("rights")}
          </p>
          <p>{site.domain}</p>
        </div>
      </Container>
    </footer>
  );
}
