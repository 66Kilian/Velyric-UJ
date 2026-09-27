import { NewPasswordForm } from "@/components/auth/NewPasswordForm";
import { authMetadata, initLocale } from "@/i18n/page";

export const generateMetadata = ({ params }: PageProps<"/[locale]/auth/uj-jelszo">) =>
  authMetadata(params, "newPassword");

// ÚJ JELSZÓ (a jelszó-visszaállító link után)
export default async function NewPasswordPage({ params, searchParams }: PageProps<"/[locale]/auth/uj-jelszo">) {
  await initLocale(params);
  const { error } = await searchParams;
  return <NewPasswordForm linkError={Boolean(error)} />;
}
