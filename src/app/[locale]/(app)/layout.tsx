import { initLocale } from "@/i18n/page";
import { WelcomeToast } from "@/components/auth/WelcomeToast";

// A bejelentkezett felület kerete (a beállítás saját fejlécet és hátteret kap)
export default async function AppLayout({ children, params }: LayoutProps<"/[locale]">) {
  await initLocale(params);
  return (
    <>
      {children}
      <WelcomeToast />
    </>
  );
}
