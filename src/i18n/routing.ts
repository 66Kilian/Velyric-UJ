import { defineRouting } from "next-intl/routing";

// Nyelvi útvonalak: a magyar az alap (előtag nélkül), az angol /en, a német /de alatt.
// A pathnames alatt az oldalak nyelvenként saját, beszédes URL-t kapnak.
export const routing = defineRouting({
  locales: ["hu", "en", "de"],
  defaultLocale: "hu",
  localePrefix: "as-needed",
  pathnames: {
    "/": "/",
    "/bejelentkezes": { hu: "/bejelentkezes", en: "/login", de: "/anmelden" },
    "/regisztracio": { hu: "/regisztracio", en: "/signup", de: "/registrieren" },
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
