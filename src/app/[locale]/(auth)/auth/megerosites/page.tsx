import { ConfirmResult } from "@/components/auth/ConfirmResult";
import { authMetadata, initLocale } from "@/i18n/page";

export const generateMetadata = ({ params }: PageProps<"/[locale]/auth/megerosites">) =>
  authMetadata(params, "confirm");

// E-MAIL MEGERŐSÍTÉS eredménye (a /auth/confirm irányít ide)
export default async function ConfirmPage({ params, searchParams }: PageProps<"/[locale]/auth/megerosites">) {
  await initLocale(params);
  const { error } = await searchParams;
  return <ConfirmResult error={Boolean(error)} />;
}
