import { defineRouting } from "next-intl/routing";

// Nyelvi útvonalak: a magyar az alap (előtag nélkül), az angol /en, a német /de alatt.
// A pathnames alatt az oldalak nyelvenként saját, beszédes URL-t kapnak.
export const routing = defineRouting({
  locales: ["hu", "en", "de"],
  defaultLocale: "hu",
  localePrefix: "as-needed",
  // Nincs automatikus átirányítás süti/böngészőnyelv alapján: egy URL = egy nyelv
  // (keresőbarát, gyorsítótárazható). Nyelvet a nyelvváltóval lehet váltani.
  localeDetection: false,
  pathnames: {
    "/": "/",
    "/bejelentkezes": { hu: "/bejelentkezes", en: "/login", de: "/anmelden" },
    "/regisztracio": { hu: "/regisztracio", en: "/signup", de: "/registrieren" },
    "/adatvedelem": { hu: "/adatvedelem", en: "/privacy", de: "/datenschutz" },
    // Iparági megoldás-oldalak
    "/megoldasok/szepsegszalonok": { hu: "/megoldasok/szepsegszalonok", en: "/solutions/beauty-salons", de: "/loesungen/salons" },
    "/megoldasok/rendelok": { hu: "/megoldasok/rendelok", en: "/solutions/clinics", de: "/loesungen/praxen" },
    "/megoldasok/ettermek": { hu: "/megoldasok/ettermek", en: "/solutions/restaurants", de: "/loesungen/restaurants" },
    "/megoldasok/autoszervizek": { hu: "/megoldasok/autoszervizek", en: "/solutions/auto-repair", de: "/loesungen/werkstaetten" },
    "/aszf": { hu: "/aszf", en: "/terms", de: "/agb" },
    "/auth/megerosites": {
      hu: "/auth/megerosites",
      en: "/auth/confirmed",
      de: "/auth/bestaetigt",
    },
    "/auth/uj-jelszo": {
      hu: "/auth/uj-jelszo",
      en: "/auth/new-password",
      de: "/auth/neues-passwort",
    },
  },
});

export type Locale = (typeof routing.locales)[number];
export type AppPathname = keyof typeof routing.pathnames;
