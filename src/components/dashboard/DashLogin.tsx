"use client";

import { ArrowRight, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import mark from "../../../public/brand/velyric-mark.png";
import { PasswordField, TextField } from "@/components/auth/Fields";
import { FormAlert } from "@/components/auth/FormAlert";
import { GoogleButton, OrDivider } from "@/components/auth/GoogleButton";
import { Orb } from "@/components/setup/Guide";
import { Button } from "@/components/ui/Button";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { authCallbackUrl, authErrorKey, isValidEmail } from "@/lib/auth";
import { DASHBOARD_URL, dashPath } from "@/lib/dashboard/url";
import { DEMO_ENABLED, demoSignIn } from "@/lib/demo";
import { site } from "@/lib/site";
import { getSupabaseBrowser } from "@/lib/supabase/client";

const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 60;

// A KEZELŐ BEJELENTKEZÉSE – külön a fő oldaltól (saját munkamenet az aldomainen).
// Ha a fiókon kétlépcsős azonosítás van, a jelszó után a hitelesítő app kódját is kéri.
export function DashLogin({ base, mfa: mfaRequired, expired }: { base: string; mfa: boolean; expired: boolean }) {
  const t = useTranslations("dash.login");
  const tAuth = useTranslations("auth");
  const locale = useLocale();
  const [step, setStep] = useState<"password" | "mfa">(mfaRequired ? "mfa" : "password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockLeft, setLockLeft] = useState(0);
  const failures = useRef(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (lockLeft <= 0) return;
    const id = setTimeout(() => setLockLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [lockLeft]);

  useEffect(() => {
    if (step === "mfa") codeRef.current?.focus();
  }, [step]);

  const home = dashPath(locale, base, "/");
  const enter = () => window.location.assign(home);

  const logEvent = async (type: string) => {
    const supabase = getSupabaseBrowser();
    const { data } = (await supabase?.auth.getUser()) ?? { data: null };
    if (supabase && data?.user) await supabase.from("security_events").insert({ user_id: data.user.id, type });
  };

  const onPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (lockLeft > 0) return;
    if (!isValidEmail(email) || !password) return setError(tAuth("errors.invalidCredentials"));
    setLoading(true);
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setLoading(false);
      if (DEMO_ENABLED && demoSignIn(email, password)) return enter();
      return fail();
    }
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (authError) {
      setLoading(false);
      const key = authErrorKey(authError);
      return key === "invalidCredentials" ? fail() : setError(tAuth(`errors.${key}`));
    }
    failures.current = 0;
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
      setLoading(false);
      setStep("mfa");
      return;
    }
    await logEvent("login");
    enter();
  };

  const fail = () => {
    setPassword("");
    setError(tAuth("errors.invalidCredentials"));
    if (++failures.current >= MAX_ATTEMPTS) {
      failures.current = 0;
      setLockLeft(LOCK_SECONDS);
    }
  };

  const onMfa = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const supabase = getSupabaseBrowser();
    if (!supabase || !/^\d{6}$/.test(code)) return setError(t("codeInvalid"));
    setLoading(true);
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const factor = factors?.totp.find((f) => f.status === "verified");
    if (!factor) {
      setLoading(false);
      return setError(t("codeInvalid"));
    }
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
    if (verifyError) {
      setLoading(false);
      setCode("");
      return setError(t("codeInvalid"));
    }
    await logEvent("login");
    enter();
  };

  // Elfelejtett jelszó: a fő oldal bejelentkezésén (onnan küldjük a visszaállító linket)
  const forgotHref = `${DASHBOARD_URL ? site.url : ""}${getPathname({ locale: locale as Locale, href: "/bejelentkezes" })}`;

  return (
    <div className="relative isolate grid min-h-dvh overflow-hidden bg-canvas lg:grid-cols-[1.1fr_1fr]">
      {/* ---- Bal oldal: hangulat ---- */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="cloud-float absolute -top-40 -left-40 h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(closest-side,rgb(255_0_122/0.22),transparent)] blur-2xl" />
        <div className="cloud-float-slow absolute -right-40 -bottom-40 h-[36rem] w-[44rem] rounded-full bg-[radial-gradient(closest-side,rgb(240_0_255/0.14),transparent)] blur-2xl" />
      </div>
      <div className="relative hidden flex-col justify-between border-r border-line p-12 lg:flex xl:p-16">
        <div className="flex items-center gap-3">
          <Image src={mark} alt="" sizes="48px" className="h-8 w-auto" priority />
          <span className="wordmark text-sm">Velyric</span>
          <span className="ml-2 rounded-full border border-line-strong px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">{t("badge")}</span>
        </div>
        <div className="max-w-lg">
          <Orb size="lg" active />
          <p className="mt-10 font-[family-name:var(--font-serif)] text-[3.4rem] leading-[1.02] font-semibold tracking-[-0.01em] text-balance">{t("hero")}</p>
          <p className="mt-6 max-w-md text-lead text-muted">{t("heroText")}</p>
        </div>
        <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted">
          <li className="flex items-center gap-2">
            <LockKeyhole className="size-4 text-accent-ink" aria-hidden="true" />
            {t("trustEncrypted")}
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-accent-ink" aria-hidden="true" />
            {t("trustGdpr")}
          </li>
        </ul>
      </div>

      {/* ---- Jobb oldal: belépés ---- */}
      <main id="tartalom" className="flex flex-col items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <Image src={mark} alt="" sizes="48px" className="h-7 w-auto" priority />
            <span className="wordmark text-sm">Velyric</span>
          </div>
          <p className="text-xs font-semibold tracking-[0.16em] text-accent-ink uppercase">{t("eyebrow")}</p>
          <h1 className="mt-3 text-[2.2rem] leading-tight font-bold tracking-[-0.02em]">{step === "mfa" ? t("mfaTitle") : t("title")}</h1>
          <p className="mt-2 text-muted">{step === "mfa" ? t("mfaText") : t("subtitle")}</p>

          <div className="mt-8 flex flex-col gap-5">
            {expired && step === "password" && <FormAlert kind="info">{t("expired")}</FormAlert>}
            {lockLeft > 0 ? (
              <FormAlert kind="error">{tAuth("errors.locked", { seconds: lockLeft })}</FormAlert>
            ) : (
              error && <FormAlert kind="error">{error}</FormAlert>
            )}

            {step === "password" ? (
              <>
                {!DEMO_ENABLED && (
                  <>
                    <GoogleButtonDash onError={setError} />
                    <OrDivider label={tAuth("common.or")} />
                  </>
                )}
                {DEMO_ENABLED && <FormAlert kind="info">{t("demoHint")}</FormAlert>}
                <form onSubmit={onPassword} noValidate className="flex flex-col gap-5">
                  <TextField label={tAuth("common.email")} type="email" name="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <PasswordField label={tAuth("common.password")} name="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <Button type="submit" size="lg" loading={loading} loadingText={tAuth("login.loading")} disabled={lockLeft > 0} className="w-full">
                    {t("submit")}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                </form>
                <a href={forgotHref} className="self-center text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline">
                  {tAuth("login.forgot")}
                </a>
              </>
            ) : (
              <form onSubmit={onMfa} noValidate className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="mfa-code" className="text-sm font-medium text-ink/90">
                    {t("code")}
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" aria-hidden="true" />
                    <input
                      ref={codeRef}
                      id="mfa-code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="tabular h-14 w-full rounded-xl border border-line-strong bg-canvas/70 pr-4 pl-12 text-2xl tracking-[0.5em] outline-none focus:border-brand-pink/70"
                    />
                  </div>
                </div>
                <Button type="submit" size="lg" loading={loading} className="w-full">
                  {t("verify")}
                </Button>
              </form>
            )}
          </div>
          <p className="mt-10 text-center text-xs leading-relaxed text-muted">{t("footer")}</p>
        </div>
      </main>
    </div>
  );
}

// Google-belépés a kezelőbe (visszatérés a kezelő főoldalára)
function GoogleButtonDash({ onError }: { onError: (m: string) => void }) {
  const locale = useLocale();
  return <GoogleButton onError={onError} redirectTo={() => authCallbackUrl("/kezelo", locale)} />;
}
