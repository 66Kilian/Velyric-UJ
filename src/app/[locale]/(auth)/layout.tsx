import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/Logo";
import { LanguageDropdown } from "@/components/nav/LanguageSwitcher";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { initLocale } from "@/i18n/page";

// Az auth-oldalak kerete: letisztult fejléc (logó + nyelv), középen a kártya
export default async function AuthLayout({ children, params }: LayoutProps<"/[locale]">) {
  await initLocale(params);
  const t = await getTranslations("auth.common");
  const tBrand = await getTranslations("brand");

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-band">
      <header>
        <Container className="flex h-[var(--nav-h)] items-center justify-between">
          <Link href="/" aria-label={tBrand("homeLabel")} className="rounded-lg">
            <Logo size="md" eager />
          </Link>
          <LanguageDropdown />
        </Container>
      </header>
      <main id="tartalom" className="flex flex-1 flex-col items-center justify-center px-5 py-10 sm:py-16">
        {children}
        <Link
          href="/"
          className="mt-8 inline-flex min-h-12 items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t("backHome")}
        </Link>
      </main>
    </div>
  );
}
