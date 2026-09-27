import { initLocale } from "@/i18n/page";
import { WelcomeToast } from "@/components/auth/WelcomeToast";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/nav/Navbar";

// A landing oldal kerete: hangulat-háttér + sticky navbar + tartalom + footer
export default async function MarketingLayout({ children, params }: LayoutProps<"/[locale]">) {
  // Statikus rendereléshez minden layoutban be kell állítani a nyelvet
  await initLocale(params);
  return (
    <>
      <Navbar />
      <main id="tartalom" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer />
      <WelcomeToast />
    </>
  );
}
