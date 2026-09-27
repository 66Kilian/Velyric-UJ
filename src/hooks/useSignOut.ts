"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { demoSignOut } from "@/lib/demo";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";

// Kijelentkezés + visszajelzés
export function useSignOut() {
  const t = useTranslations("auth.session");
  const router = useRouter();
  return async () => {
    demoSignOut();
    await getSupabaseBrowser()?.auth.signOut();
    toast.success(t("loggedOut"));
    router.refresh();
  };
}
