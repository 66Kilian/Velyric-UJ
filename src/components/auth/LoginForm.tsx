"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Link, useRouter } from "@/i18n/navigation";
import { authCallbackUrl, authErrorKey, isValidEmail, type AuthErrorKey } from "@/lib/auth";
import { DEMO_ENABLED, demoSignIn } from "@/lib/demo";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import { AuthCard } from "./AuthCard";
import { PasswordField, TextField } from "./Fields";
import { FormAlert } from "./FormAlert";
import { GoogleButton, OrDivider } from "./GoogleButton";
import { ResendButton } from "./ResendButton";

// Kliensoldali fék: 5 sikertelen próba után 30 mp szünet
// (a Supabase szerveroldali rate limitje mellett, plusz védelemként)
const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 30;

type View = "login" | "forgot";

export function LoginForm({ initialError }: { initialError?: string | null }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();

  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [errorKey, setErrorKey] = useState<AuthErrorKey | null>(null);
  const [forgotSent, setForgotSent] = useState(false);

  const failures = useRef(0);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [lockLeft, setLockLeft] = useState(0);
  useEffect(() => {
    if (lockLeft <= 0) return;
    const id = setTimeout(() => setLockLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [lockLeft]);

  const emailError = !email.trim()
    ? t("errors.emailRequired")
    : !isValidEmail(email)
      ? t("errors.emailInvalid")
      : null;
  const passwordError = !password ? t("errors.passwordRequired") : null;

  const fail = (key: AuthErrorKey) => {
    setErrorKey(key);
    setError(t(`errors.${key}`));
  };

  // ---- Bejelentkezés ----
  const onLogin = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    setErrorKey(null);
    if (emailError || passwordError || lockLeft > 0) return;

    const supabase = getSupabaseBrowser();
    let authError: unknown = null;
    setLoading(true);
    if (supabase) {
      ({ error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password }));
    } else if (DEMO_ENABLED) {
      // Bemutató mód: csak a teszt fiók léphet be
      if (!demoSignIn(email, password)) authError = { code: "invalid_credentials" };
    }
    setLoading(false);

    if (authError) {
      const key = authErrorKey(authError);
      if (key === "invalidCredentials") {
        // Az e-mail marad, a jelszó törlődik és fókuszt kap – azonnal újrapróbálható
        setPassword("");
        setSubmitted(false); // a mezőhiba ne duplázza a fenti üzenetet
        passwordRef.current?.focus();
        if (++failures.current >= MAX_ATTEMPTS) {
          failures.current = 0;
          setLockLeft(LOCK_SECONDS);
        }
      }
      return fail(key);
    }

    failures.current = 0;
    toast.success(t("login.success"));
    router.replace("/");
    router.refresh();
  };

  // ---- Elfelejtett jelszó ----
  const onForgot = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    if (emailError) return;

    const supabase = getSupabaseBrowser();
    if (!supabase) return setError(t("common.notConfigured"));

    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: authCallbackUrl("/auth/uj-jelszo", locale),
    });
    setLoading(false);

    // Biztonság: mindig ugyanaz a válasz, akár létezik a fiók, akár nem
    const key = resetError ? authErrorKey(resetError) : null;
    if (key === "rateLimit" || key === "network") return fail(key);
    setForgotSent(true);
  };

  const switchView = (next: View) => {
    setView(next);
    setError(null);
    setErrorKey(null);
    setSubmitted(false);
    setForgotSent(false);
  };

  const emailField = (
    <TextField
      label={t("common.email")}
      type="email"
      name="email"
      autoComplete="email"
      inputMode="email"
      placeholder={t("common.emailPlaceholder")}
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      error={submitted ? emailError : null}
    />
  );

  if (view === "forgot") {
    return (
      <AuthCard
        title={t("forgot.title")}
        subtitle={t("forgot.subtitle")}
        footer={
          <button
            type="button"
            onClick={() => switchView("login")}
            className="min-h-12 font-semibold text-fg underline-offset-4 hover:underline"
          >
            ← {t("forgot.back")}
          </button>
        }
      >
        {error && <FormAlert kind="error" className="mb-6">{error}</FormAlert>}
        {forgotSent ? (
          <FormAlert kind="success">{t("forgot.sent")}</FormAlert>
        ) : (
          <form onSubmit={onForgot} noValidate className="flex flex-col gap-5">
            {emailField}
            <Button type="submit" size="lg" loading={loading} loadingText={t("forgot.loading")} className="w-full">
              {t("forgot.submit")}
            </Button>
          </form>
        )}
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={t("login.title")}
      subtitle={t("login.subtitle")}
      footer={
        <>
          {t("login.noAccount")}{" "}
          <Link href="/regisztracio" className="font-semibold text-fg underline-offset-4 hover:underline">
            {t("login.signupLink")}
          </Link>
        </>
      }
    >
      {lockLeft > 0 ? (
        <FormAlert kind="error" className="mb-6">{t("errors.locked", { seconds: lockLeft })}</FormAlert>
      ) : (
        error && (
          <FormAlert kind="error" className="mb-6">
            {error}
            {errorKey === "notConfirmed" && (
              <span className="mt-1 block">
                <ResendButton email={email.trim()} startCooling={false} label={t("login.resendConfirm")} />
              </span>
            )}
          </FormAlert>
        )
      )}

      <GoogleButton onError={setError} />
      <OrDivider label={t("common.or")} />

      <form onSubmit={onLogin} noValidate className="flex flex-col gap-5">
        {emailField}
        <PasswordField
          ref={passwordRef}
          label={t("common.password")}
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={submitted ? passwordError : null}
        />
        <div className="-mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => switchView("forgot")}
            className="min-h-10 text-sm font-medium text-muted underline-offset-4 transition-colors hover:text-fg hover:underline"
          >
            {t("login.forgot")}
          </button>
        </div>
        <Button
          type="submit"
          size="lg"
          loading={loading}
          loadingText={t("login.loading")}
          disabled={lockLeft > 0}
          className="w-full"
        >
          {t("login.submit")}
        </Button>
      </form>
    </AuthCard>
  );
}
