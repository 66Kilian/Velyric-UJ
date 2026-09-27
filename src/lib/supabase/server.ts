import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "./config";

// Szerveroldali Supabase kliens (route handlerek, szerver komponensek)
export async function getSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Szerver komponensből nem írható süti – ilyenkor a proxy frissíti a munkamenetet
        }
      },
    },
  });
}
