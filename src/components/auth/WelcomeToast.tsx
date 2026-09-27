"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "@/lib/toast";

// Google-bejelentkezés után (?welcome=1) egy zöld „Üdv!” értesítés, majd az URL megtisztítása
export function WelcomeToast() {
  const t = useTranslations("auth.session");
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("welcome") !== "1") return;
    toast.success(t("welcome"));
    url.searchParams.delete("welcome");
    history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, [t]);
  return null;
}
