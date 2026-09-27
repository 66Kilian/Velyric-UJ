import type { ReactNode } from "react";
import { Navbar } from "@/components/nav/Navbar";

// A landing oldal kerete: sticky navbar + tartalom (a footer a 4. lépésben jön ide)
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main id="tartalom" tabIndex={-1} className="outline-none">
        {children}
      </main>
    </>
  );
}
