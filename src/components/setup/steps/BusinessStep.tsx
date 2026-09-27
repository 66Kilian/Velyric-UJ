"use client";

import { RefreshCw, Sparkles, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { TextField } from "@/components/auth/Fields";
import { FormAlert } from "@/components/auth/FormAlert";
import { Button } from "@/components/ui/Button";
import { ApiError, requestAnalyze } from "@/lib/onboarding/client";
import type { AnalyzeResult } from "@/lib/onboarding/schema";
import { Orb } from "../Guide";
import type { StepProps } from "../types";
import { TextArea } from "../ui";

const EXAMPLES = ["clinic", "salon", "restaurant", "auto"] as const;
const EXAMPLE_LABEL = { clinic: "exampleClinic", salon: "exampleSalon", restaurant: "exampleRestaurant", auto: "exampleAuto" } as const;
const MAX = 2000;

// 1. LÉPÉS – a vállalkozás bemutatása; az MI ebből profilt, feladatokat és köszönést készít
export function BusinessStep({ data, update, analyzedFrom, onAnalyzed }: StepProps & {
  analyzedFrom: string | null;
  onAnalyzed: (result: AnalyzeResult, description: string) => void;
}) {
  const t = useTranslations("setup.business");
  const locale = useLocale() as "hu" | "en" | "de";
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const phases = t.raw("analyzing") as string[];

  const { name, description, website } = data.business;
  const tooShort = description.trim().length < 20;
  const noName = name.trim().length < 2;
  const profile = data.profile;
  const stale = profile && analyzedFrom !== null && analyzedFrom !== description.trim();

  useEffect(() => {
    if (!loading) return;
    const id = window.setInterval(() => setPhase((p) => Math.min(p + 1, phases.length - 1)), 1400);
    return () => window.clearInterval(id);
  }, [loading, phases.length]);

  const setBusiness = (patch: Partial<typeof data.business>) =>
    update((d) => ({ ...d, business: { ...d.business, ...patch } }));

  const analyze = async () => {
    setTouched(true);
    setError(null);
    if (tooShort || noName) return;
    setLoading(true);
    setPhase(0);
    try {
      const result = await requestAnalyze({ action: "analyze", locale, name: name.trim(), description: description.trim(), website: website.trim() });
      onAnalyzed(result, description.trim());
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    } catch (e) {
      setError(e instanceof ApiError && e.status === 429 ? t("rateLimited") : t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label={t("name")}
          name="organization"
          autoComplete="organization"
          placeholder={t("namePlaceholder")}
          value={name}
          maxLength={120}
          onChange={(e) => setBusiness({ name: e.target.value })}
          error={touched && noName ? t("nameRequired") : null}
        />
        <TextField
          label={`${t("website")} (${t("optional")})`}
          name="url"
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder={t("websitePlaceholder")}
          value={website}
          maxLength={200}
          onChange={(e) => setBusiness({ website: e.target.value })}
        />
      </div>

      <TextArea
        label={t("description")}
        placeholder={t("descriptionPlaceholder")}
        value={description}
        rows={5}
        maxLength={MAX}
        onChange={(e) => setBusiness({ description: e.target.value })}
        hint={t("descriptionHint")}
        error={touched && tooShort ? t("tooShort") : null}
        counter={{ value: description.length, max: MAX }}
      />

      <div className="-mt-2 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted">{t("examples")}</span>
        {EXAMPLES.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setBusiness({ description: t(`exampleTexts.${key}`) })}
            className="min-h-9 rounded-full border border-line-strong bg-canvas/50 px-3.5 text-xs font-medium text-muted transition-colors hover:border-ink/25 hover:text-ink"
          >
            {t(EXAMPLE_LABEL[key])}
          </button>
        ))}
      </div>

      {error && <FormAlert kind="error">{error}</FormAlert>}

      {loading ? (
        <div role="status" className="flex items-center gap-4 rounded-panel border border-line-strong bg-canvas/50 p-5">
          <Orb active />
          <div className="min-w-0">
            <p key={phase} className="turn-in font-semibold">
              {phases[phase]}
            </p>
            <div className="mt-2 h-1 w-48 overflow-hidden rounded-full bg-line-strong">
              <span className="analyze-bar block h-full w-1/3 rounded-full bg-brand" />
            </div>
          </div>
        </div>
      ) : (
        (!profile || stale) && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" onClick={analyze} className="sm:self-start">
              {profile ? <RefreshCw className="size-4" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
              {profile ? t("reanalyze") : t("analyze")}
            </Button>
            {stale && <p className="text-sm text-muted">{t("changed")}</p>}
          </div>
        )
      )}

      {profile && !loading && (
        <div ref={resultRef} className="rise-in rounded-media border-brand p-5 shadow-lift sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-bold tracking-tight">{t("resultTitle")}</h3>
            <span className="rounded-full border border-brand-pink/40 bg-brand-pink/10 px-3 py-1 text-xs font-semibold text-accent-ink">
              {profile.industryLabel}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">{t("resultEdit")}</p>

          <TextField
            className="mt-5"
            label={t("name")}
            value={profile.businessName}
            maxLength={120}
            onChange={(e) => update((d) => (d.profile ? { ...d, profile: { ...d.profile, businessName: e.target.value } } : d))}
          />
          <TextArea
            className="mt-4"
            label={t("summary")}
            rows={3}
            maxLength={600}
            value={profile.summary}
            onChange={(e) => update((d) => (d.profile ? { ...d, profile: { ...d.profile, summary: e.target.value } } : d))}
          />
          {profile.services.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-ink/90">{t("services")}</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {profile.services.map((s, i) => (
                  <li key={`${s}-${i}`} className="inline-flex items-center gap-1 rounded-full border border-line-strong bg-canvas/60 py-1.5 pr-1.5 pl-3 text-sm">
                    {s}
                    <button
                      type="button"
                      aria-label={`${s} ×`}
                      onClick={() =>
                        update((d) => (d.profile ? { ...d, profile: { ...d.profile, services: d.profile.services.filter((_, j) => j !== i) } } : d))
                      }
                      className="flex size-6 items-center justify-center rounded-full text-muted hover:bg-raised hover:text-ink"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
