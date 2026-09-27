"use client";

import { Check, Lock, Phone, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { FormAlert } from "@/components/auth/FormAlert";
import { Button } from "@/components/ui/Button";
import { ApiError, startCheckout } from "@/lib/onboarding/client";
import { site } from "@/lib/site";
import type { PlanInfo } from "@/lib/server/stripe";
import type { StepProps } from "../types";

const METHODS = ["Visa", "Mastercard", "Apple Pay", "Google Pay"];

// 6. LÉPÉS – összesítő és fizetés (Stripe Checkout: kártya, Apple Pay, Google Pay).
// Ha a fizetés még nincs beállítva, bemutató módban terhelés nélkül továbbléphet.
export function PaymentStep({ data, userId, plan, notice, onFinishDemo, goTo }: StepProps & {
  plan: PlanInfo;
  notice: string | null;
  onFinishDemo: () => void;
}) {
  const t = useTranslations("setup.payment");
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canPay = plan.configured && !!userId;

  const price =
    plan.amount != null && plan.currency
      ? new Intl.NumberFormat(locale, { style: "currency", currency: plan.currency.toUpperCase(), maximumFractionDigits: plan.amount % 100 ? 2 : 0 }).format(plan.amount / 100)
      : null;

  const pay = async () => {
    setError(null);
    setLoading(true);
    try {
      const { url } = await startCheckout(locale, data.billing);
      // Csak a Stripe saját fizetőoldalára irányítunk át
      if (!url.startsWith("https://checkout.stripe.com/")) throw new ApiError("stripe", 502);
      window.location.assign(url);
    } catch (e) {
      setLoading(false);
      if (e instanceof ApiError && (e.code === "tax_rejected" || e.code === "invalid_billing")) setError(t("taxRejected"));
      else setError(t("error"));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {notice && <FormAlert kind="info">{notice}</FormAlert>}

      <div className="overflow-hidden rounded-media border-brand shadow-lift">
        <div className="flex flex-col gap-5 p-6 sm:p-8">
          <p className="text-xs font-semibold tracking-[0.14em] text-accent-ink uppercase">{t("summary")}</p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold tracking-tight">{plan.name ?? t("plan")}</h3>
              <p className="mt-1 text-sm text-muted">
                {data.profile?.businessName || data.business.name} · {data.voice.agentName}
              </p>
            </div>
            <p className="text-right">
              {price ? (
                <>
                  <span className="tabular text-3xl font-bold tracking-tight">{price}</span>{" "}
                  <span className="text-sm text-muted">{plan.oneTime ? t("oneTime") : plan.interval ? t(`perInterval.${plan.interval}`) : ""}</span>
                </>
              ) : (
                <span className="text-lg font-semibold text-muted">{t("custom")}</span>
              )}
            </p>
          </div>
          <ul className="flex flex-col gap-2.5 border-t border-line pt-5">
            {(t.raw("includes") as string[]).map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm">
                <span className="flex size-5 items-center justify-center rounded-full bg-success/15">
                  <Check className="size-3 text-success" strokeWidth={3} aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-5 text-sm text-muted">
            <span className="min-w-0 truncate">{t("for", { name: data.billing.name })}</span>
            <button type="button" onClick={() => goTo(4)} className="min-h-10 font-semibold text-ink underline-offset-4 hover:underline">
              {t("edit")}
            </button>
          </div>
        </div>
      </div>

      {error && <FormAlert kind="error">{error}</FormAlert>}

      {canPay ? (
        <div className="flex flex-col gap-4">
          <Button size="lg" onClick={pay} loading={loading} loadingText={t("redirecting")} className="w-full">
            <Lock className="size-4" aria-hidden="true" />
            {t("pay")}
          </Button>
          <p className="flex items-center justify-center gap-2 text-center text-xs text-muted">
            <Lock className="size-3.5" aria-hidden="true" />
            {t("secure")}
          </p>
          <ul aria-label={t("methods")} className="flex flex-wrap justify-center gap-2">
            {METHODS.map((m) => (
              <li key={m} className="rounded-md border border-line-strong bg-canvas/60 px-2.5 py-1 text-[11px] font-semibold text-muted">
                {m}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-panel border border-line-strong bg-canvas/50 p-5 sm:p-6">
          <p className="flex items-center gap-2 font-semibold">
            <Sparkles className="size-4 text-accent-ink" aria-hidden="true" />
            {t("demoTitle")}
          </p>
          <p className="text-sm leading-relaxed text-muted">{plan.configured && !userId ? t("loginRequired") : t("demoText")}</p>
          <Button size="lg" variant="secondary" onClick={onFinishDemo} className="w-full sm:w-auto sm:self-start">
            {t("demoContinue")}
          </Button>
        </div>
      )}

      <p className="flex flex-wrap items-center justify-center gap-x-2 text-center text-sm text-muted">
        {t("questions")}
        <a href={site.phoneHref} className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-ink underline-offset-4 hover:underline">
          <Phone className="size-3.5" aria-hidden="true" />
          {site.phone}
        </a>
      </p>
    </div>
  );
}
