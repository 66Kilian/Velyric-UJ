import type { routing } from "@/i18n/routing";
import type messages from "../messages/hu.json";

// Típusbiztos fordítások: elgépelt kulcsnál fordítási hibát kapunk
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
