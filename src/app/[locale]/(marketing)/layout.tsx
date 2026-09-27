import type { ReactNode } from "react";
import { Ambient } from "@/components/decor/Ambient";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/nav/Navbar";

// A landing oldal kerete: hangulat-háttér + sticky navbar + tartalom + footer
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Ambient />
      <Navbar />
      <main id="tartalom" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer />
    </>
  );
}
