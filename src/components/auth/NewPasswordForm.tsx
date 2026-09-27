"use client";

import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useRouter } from "@/i18n/navigation";
import { MIN_PASSWORD, authErrorKey } from "@/lib/auth";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import { AuthCard } from "./AuthCard";
import { PasswordField } from "./Fields";
import { FormAlert } from "./FormAlert";
import { StrengthMeter } from "./StrengthMeter";

type Status = "checking" | "ready" | "expired";

// ÚJ JELSZÓ: a visszaállító link után (a /auth/confirm már beléptette a felhasználót)
export function NewPasswordForm({ linkError }: { linkError: boolean }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [status, setStatus] = useState<Status>(linkError ? "expired" : "checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Van érvényes (visszaállítási) munkamenet? Ha nincs → a link lejárt
  useEffect(() => {
    if (linkError) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setStatus(data.session ? "ready" : "expired"));
  }, [linkError]);

  const passwordError = password.length < MIN_PASSWORD ? t("errors.passwordShort") : null;
  const confirmError = !confirm ? t("errors.confirmRequired") : confirm !== password ? t("errors.mismatch") : null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    if (passwordError || confirmError) return;

    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) return setError(t(`errors.${authErrorKey(updateError)}`));

    toast.success(t("newPassword.success"));
    router.replace("/");
    router.refresh();
  };

  if (status === "checking") {
    return (
      <AuthCard title={t("newPassword.title")}>
        <p className="flex items-center justify-center gap-3 text-muted" role="status">
          <Spinner /> {t("newPassword.checking")}
        </p>
      </AuthCard>
    );
  }

  if (status === "expired") {
    return (
      <AuthCard title={t("newPassword.expiredTitle")}>
        <div className="flex flex-col items-center gap-6 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10">
            <Clock className="size-7 text-amber-300" aria-hidden="true" />
          </span>
          <p className="text-muted">{t("newPassword.expiredText")}</p>
          <Button href="/bejelentkezes" size="lg" className="w-full">
            {t("newPassword.expiredCta")}
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t("newPassword.title")} subtitle={t("newPassword.subtitle")}>
      {error && <FormAlert kind="error" className="mb-6">{error}</FormAlert>}
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {/* Rejtett felhasználónév-mező: a jelszókezelők így a jó fiókhoz mentik */}
        <input type="text" name="username" autoComplete="username" hidden readOnly />
        <PasswordField
          label={t("newPassword.newPassword")}
          name="new-password"
          autoComplete="new-password"
          placeholder={t("common.passwordPlaceholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={submitted ? passwordError : null}
        >
          <StrengthMeter password={password} />
        </PasswordField>
        <PasswordField
          label={t("newPassword.confirmNew")}
          name="confirm-password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={(confirm && confirm !== password) || submitted ? confirmError : null}
        />
        <Button type="submit" size="lg" loading={loading} loadingText={t("newPassword.loading")} className="mt-1 w-full">
          {t("newPassword.submit")}
        </Button>
      </form>
    </AuthCard>
  );
}
