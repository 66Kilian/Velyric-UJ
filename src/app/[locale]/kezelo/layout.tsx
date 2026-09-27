import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";
import { initLocale } from "@/i18n/page";

// A „Klasszikus” stílus díszbetűje (saját kiszolgálás, latin-ext az ő/ű miatt)
const serif = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Kezelő", template: "%s · Velyric" },
  robots: { index: false, follow: false },
};

// A KEZELŐ kerete (kezelo.velyric.com) – a fő oldal fejléce és lábléce nélkül
export default async function DashboardRootLayout({ children, params }: LayoutProps<"/[locale]">) {
  await initLocale(params);
  return <div className={serif.variable}>{children}</div>;
}
