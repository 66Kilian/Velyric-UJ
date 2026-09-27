"use client";

import { CircleCheckBig, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AuthCard } from "./AuthCard";

// E-MAIL MEGERŐSÍTÉS eredménye: siker ✔ vagy „lejárt link” (barátságos kiút)
export function ConfirmResult({ error }: { error: boolean }) {
  const t = useTranslations("auth.confirm");
  // A Supabase néha az URL #részében jelzi a hibát (pl. #error_code=otp_expired)
  const [failed, setFailed] = useState(error);
  useEffect(() => {
    if (window.location.hash.includes("error")) {
      const id = requestAnimationFrame(() => setFailed(true));
      return () => cancelAnimationFrame(id);
    }
  }, []);

  if (failed) {
    return (
      <AuthCard title={t("errorTitle")}>
        <div className="flex flex-col items-center gap-6 text-center">
          <span className="flex size-14 items-center justify-center rounded-xl border border-warning/30 bg-warning/10">
            <Clock className="size-7 text-warning" aria-hidden="true" />
          </span>
          <p className="text-muted">{t("errorText")}</p>
          <Button href="/bejelentkezes" size="lg" className="w-full">
            {t("errorCta")}
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t("successTitle")}>
      <div className="flex flex-col items-center gap-6 text-center">
        <span className="success-pop flex size-16 items-center justify-center rounded-full border border-success/30 bg-success/10">
          <CircleCheckBig className="size-8 text-success" aria-hidden="true" />
        </span>
        <p className="text-muted">{t("successText")}</p>
        <Button href="/" size="lg" className="w-full">
          {t("cta")}
        </Button>
      </div>
    </AuthCard>
  );
}
