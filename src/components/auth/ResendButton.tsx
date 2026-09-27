"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { authCallbackUrl, authErrorKey } from "@/lib/auth";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";

const COOLDOWN = 60;

// Megerősítő link újraküldése, 60 mp-es várakozással (spam és visszaélés ellen)
export function ResendButton({
  email,
  startCooling = true,
  label,
}: {
  email: string;
  startCooling?: boolean;
  label?: string;
}) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [seconds, setSeconds] = useState(startCooling ? COOLDOWN : 0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  const resend = async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: authCallbackUrl("/auth/megerosites", locale) },
    });
    setLoading(false);
    setSeconds(COOLDOWN);
    if (error && authErrorKey(error) === "rateLimit") toast.error(t("errors.rateLimit"));
    else toast.success(t("checkEmail.resent"));
  };

  const cooling = seconds > 0;
  return (
    <button
      type="button"
      onClick={resend}
      disabled={cooling || loading}
      className="inline-flex min-h-12 items-center gap-2 font-semibold text-accent-ink underline-offset-4 transition-colors hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
    >
      {loading && <Spinner className="size-4" />}
      {cooling ? t("checkEmail.resendIn", { seconds }) : (label ?? t("checkEmail.resend"))}
    </button>
  );
}
