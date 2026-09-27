import { SignupForm } from "@/components/auth/SignupForm";
import { authMetadata, initLocale } from "@/i18n/page";

export const generateMetadata = ({ params }: PageProps<"/[locale]/regisztracio">) => authMetadata(params, "signup");

// REGISZTRÁCIÓ
export default async function SignupPage({ params }: PageProps<"/[locale]/regisztracio">) {
  await initLocale(params);
  return <SignupForm />;
}
