import { Globe, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import mark from "../../../public/brand/velyric-mark.png";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { INDUSTRIES } from "@/lib/industries";
import { site } from "@/lib/site";

// FOOTER (Deep Navy) – egyben a „Kapcsolat” szekció (a navbar ide görget)
export function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");
  const ti = useTranslations("industries");
  const year = new Date().getFullYear();
  const linkClass = "text-on-navy transition-colors hover:text-white";

  return (
    <footer id="kapcsolat" aria-labelledby="footer-title" className="relative border-t border-line bg-deep text-ink">
      <h2 id="footer-title" className="sr-only">
        {t("contact")}
      </h2>
      <Container className="grid gap-12 py-16 sm:py-20 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-5">
          <Link href="/" className="inline-flex items-center gap-3 self-start rounded-lg">
            <Image src={mark} alt="" sizes="64px" className="h-7 w-auto" />
            <span className="wordmark text-[15px] leading-none">Velyric</span>
          </Link>
          <p className="max-w-xs leading-relaxed text-on-navy">{t("tagline")}</p>
          <a href={site.phoneHref} className="inline-flex items-center gap-2 text-lg font-semibold hover:underline">
            <Phone className="size-4 text-brand-coral" aria-hidden="true" />
            {site.phone}
          </a>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold tracking-[0.14em] text-brand-coral uppercase">{ti("label")}</h3>
          {INDUSTRIES.map((i) => (
            <Link key={i.key} href={i.href} className={linkClass}>
              {ti(`${i.key}.name`)}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold tracking-[0.14em] text-brand-coral uppercase">{t("pages")}</h3>
          <Link href={{ pathname: "/", hash: "kik-vagyunk" }} className={linkClass}>
            {nav("about")}
          </Link>
          <Link href="/bejelentkezes" className={linkClass}>
            {nav("login")}
          </Link>
          <Link href="/regisztracio" className={linkClass}>
            {nav("start")}
          </Link>
          <a href={site.url} className={`inline-flex items-center gap-2 ${linkClass}`}>
            <Globe className="size-4" aria-hidden="true" />
            {site.domain}
          </a>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold tracking-[0.14em] text-brand-coral uppercase">{t("legal")}</h3>
          <Link href="/adatvedelem" className={linkClass}>
            {t("privacy")}
          </Link>
          <Link href="/aszf" className={linkClass}>
            {t("terms")}
          </Link>
        </div>
      </Container>
      <Container>
        <div className="flex flex-col gap-2 border-t border-white/10 py-6 text-sm text-on-navy sm:flex-row sm:justify-between">
          <p>
            © {year} {site.name}. {t("rights")}
          </p>
          <p>{site.domain}</p>
        </div>
      </Container>
    </footer>
  );
}
