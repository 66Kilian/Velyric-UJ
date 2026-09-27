"use client";

import { MailCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { MIN_PASSWORD, authCallbackUrl, authErrorKey, isValidEmail } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { AuthCard } from "./AuthCard";
import { PasswordField, TextField } from "./Fields";
import { FormAlert } from "./FormAlert";
import { GoogleButton, OrDivider } from "./GoogleButton";
import { ResendButton } from "./ResendButton";
import { StrengthMeter } from "./StrengthMeter";

// REGISZTRÁCIÓ: Google elöl, alatta e-mail + jelszó kétszer (max. 3 mező)
export function SignupForm() {
  const t = useTranslations("auth");
  const locale = useLocale();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false, confirm: false });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  // Mezőnkénti hibák – a jelszó-egyezést már gépelés közben jelezzük
  const emailError = !email.trim()
    ? t("errors.emailRequired")
    : !isValidEmail(email)
      ? t("errors.emailInvalid")
      : null;
  const passwordError = password.length < MIN_PASSWORD ? t("errors.passwordShort") : null;
  const confirmError = !confirm ? t("errors.confirmRequired") : confirm !== password ? t("errors.mismatch") : null;

  const show = (field: keyof typeof touched) => submitted || touched[field];

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setFormError(null);
    if (emailError || passwordError || confirmError) return;

    const supabase = getSupabaseBrowser();
    if (!supabase) return setFormError(t("common.notConfigured"));

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: authCallbackUrl("/auth/megerosites", locale) },
    });
    setLoading(false);

    // Biztonság: ha az e-mail már foglalt, ugyanazt a képernyőt mutatjuk,
    // így az oldal nem árulja el, kinek van már fiókja
    if (error && error.code !== "user_already_exists") {
      return setFormError(t(`errors.${authErrorKey(error)}`));
    }
    setSentTo(email.trim());
  };

  // ---- „Nézd meg a postafiókodat” képernyő ----
  if (sentTo) {
    return (
      <AuthCard title={t("checkEmail.title")}>
        <div className="flex flex-col items-center gap-5 text-center">
          <span className="flex size-14 items-center justify-center rounded-xl border border-success/30 bg-success/10">
            <MailCheck className="size-7 text-success" aria-hidden="true" />
          </span>
          <p className="text-muted">
            {t("checkEmail.text")}
            <strong className="mt-1 block text-lg break-all text-ink">{sentTo}</strong>
          </p>
          <p className="text-sm text-muted">{t("checkEmail.next")}</p>
          <div className="w-full border-t border-line pt-5 text-sm">
            <span className="text-muted">{t("checkEmail.notReceived")} </span>
            <ResendButton email={sentTo} />
            <p className="mt-1 text-xs text-muted">{t("checkEmail.spam")}</p>
          </div>
          <p className="text-sm text-muted">
            {t("checkEmail.wrongEmail")}{" "}
            <button
              type="button"
              onClick={() => {
                setSentTo(null);
                setSubmitted(false);
              }}
              className="min-h-12 font-semibold text-ink underline-offset-4 hover:underline"
            >
              {t("checkEmail.restart")}
            </button>
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={t("signup.title")}
      subtitle={t("signup.subtitle")}
      footer={
        <>
          {t("signup.hasAccount")}{" "}
          <Link href="/bejelentkezes" className="font-semibold text-ink underline-offset-4 hover:underline">
            {t("signup.loginLink")}
          </Link>
        </>
      }
    >
      {!isSupabaseConfigured && <FormAlert kind="info" className="mb-6">{t("common.signupSoon")}</FormAlert>}
      {formError && <FormAlert kind="error" className="mb-6">{formError}</FormAlert>}

      <GoogleButton onError={setFormError} />
      <OrDivider label={t("common.or")} />

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <TextField
          label={t("common.email")}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder={t("common.emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((s) => ({ ...s, email: true }))}
          error={show("email") ? emailError : null}
        />
        <PasswordField
          label={t("common.password")}
          name="new-password"
          autoComplete="new-password"
          placeholder={t("common.passwordPlaceholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTouched((s) => ({ ...s, password: true }))}
          error={show("password") ? passwordError : null}
        >
          <StrengthMeter password={password} />
        </PasswordField>
        <PasswordField
          label={t("common.confirmPassword")}
          name="confirm-password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onBlur={() => setTouched((s) => ({ ...s, confirm: true }))}
          error={(confirm && confirm !== password) || show("confirm") ? confirmError : null}
        />

        <Button type="submit" size="lg" loading={loading} loadingText={t("signup.loading")} className="mt-1 w-full">
          {t("signup.submit")}
        </Button>

        <p className="text-center text-xs leading-relaxed text-muted">
          {t.rich("signup.terms", {
            terms: (chunks) => (
              <Link href="/aszf" className="underline underline-offset-2 hover:text-ink">
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link href="/adatvedelem" className="underline underline-offset-2 hover:text-ink">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </form>
    </AuthCard>
  );
}
