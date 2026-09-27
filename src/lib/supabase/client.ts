"use client";

import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./config";

// Böngészős Supabase kliens (a munkamenet sütikben él, így a szerver is látja).
// null, ha a Supabase még nincs beállítva.
export function getSupabaseBrowser() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
