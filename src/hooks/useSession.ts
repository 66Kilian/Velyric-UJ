"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { getDemoUser, subscribeDemo } from "@/lib/demo";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export type SessionUser = { email: string | null } | null;

// Az aktuálisan bejelentkezett felhasználó (vagy null) – élőben frissül.
// Supabase-munkamenet, illetve bemutató módban a teszt fiók.
export function useSession(): SessionUser {
  const [supabaseEmail, setSupabaseEmail] = useState<string | null | undefined>(undefined);
  const demoEmail = useSyncExternalStore(subscribeDemo, getDemoUser, () => null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) =>
      setSupabaseEmail(data.session ? (data.session.user.email ?? "") : null),
    );
    const { data } = supabase.auth.onAuthStateChange((_event, s) =>
      setSupabaseEmail(s ? (s.user.email ?? "") : null),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  if (supabaseEmail != null) return { email: supabaseEmail };
  if (demoEmail) return { email: demoEmail };
  return null;
}
