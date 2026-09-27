import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/auth/LoginForm";
import { authMetadata, initLocale } from "@/i18n/page";

export const generateMetadata = ({ params }: PageProps<"/[locale]/bejelentkezes">) => authMetadata(params, "login");

// BEJELENTKEZÉS (a Google-visszatérés hibája ?error=… paraméterrel jön ide)
export default async function LoginPage({ params, searchParams }: PageProps<"/[locale]/bejelentkezes">) {
  await initLocale(params);
  const { error } = await searchParams;
  const t = await getTranslations("auth.errors");
  return <LoginForm initialError={error ? t("oauth") : null} />;
}
