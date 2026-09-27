import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next 16-ban a middleware neve "proxy". Most a nyelvi átirányítást végzi,
// a Supabase munkamenet-frissítés a 6. lépésben kerül ide.
export default createMiddleware(routing);

export const config = {
  // Minden oldal, kivéve: API, Next belső fájljai, Vercel, és kiterjesztéses fájlok (képek, ikonok)
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
