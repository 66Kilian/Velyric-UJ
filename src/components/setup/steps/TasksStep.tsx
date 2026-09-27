"use client";

import { Clock, MoonStar, PhoneMissed, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { TextField } from "@/components/auth/Fields";
import { cn } from "@/lib/cn";
import { LANGS } from "@/lib/onboarding/schema";
import { isValidPhone } from "@/lib/onboarding/validate";
import type { StepProps } from "../types";
import { ChoiceCard, FieldError, Section, YesNo } from "../ui";

const COVERAGE = [
  { key: "always", icon: Clock },
  { key: "afterHours", icon: MoonStar },
  { key: "overflow", icon: PhoneMissed },
] as const;

// 2. LÉPÉS – mire kell az MI: javasolt feladatok igen/nem, elérhetőség, nyelvek, átkapcsolás
export function TasksStep({ data, update, showErrors }: StepProps & { showErrors: boolean }) {
  const t = useTranslations("setup.tasks");
  const [custom, setCustom] = useState("");
  const enabled = data.tasks.filter((x) => x.enabled).length;
  const phoneInvalid = !!data.handoffPhone.trim() && !isValidPhone(data.handoffPhone);

  const setTask = (id: string, enabledValue: boolean) =>
    update((d) => ({ ...d, tasks: d.tasks.map((x) => (x.id === id ? { ...x, enabled: enabledValue } : x)) }));

  const addTask = (e: FormEvent) => {
    e.preventDefault();
    const label = custom.trim().slice(0, 90);
    if (!label || data.tasks.length >= 14) return;
    update((d) => ({ ...d, tasks: [...d.tasks, { id: `c${Date.now()}`, label, detail: "", enabled: true, custom: true }] }));
    setCustom("");
  };

  const toggleLang = (lang: (typeof LANGS)[number]) =>
    update((d) => {
      const has = d.languages.includes(lang);
      if (has && d.languages.length === 1) return d; // legalább egy nyelv marad
      return { ...d, languages: has ? d.languages.filter((l) => l !== lang) : LANGS.filter((l) => l === lang || d.languages.includes(l)) };
    });

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <p className={cn("text-sm font-medium", enabled ? "text-muted" : "text-danger")} aria-live="polite">
          {enabled ? t("enabledCount", { count: enabled }) : t("noneEnabled")}
        </p>
        <ul className="flex flex-col gap-2.5">
          {data.tasks.map((task) => (
            <li
              key={task.id}
              className={cn(
                "flex items-center gap-4 rounded-panel border p-4 transition-colors duration-300 sm:p-5",
                task.enabled ? "border-brand-pink/35 bg-brand-pink/[0.06]" : "border-line bg-canvas/40",
              )}
            >
              <div className="min-w-0 flex-1">
                <p id={`task-${task.id}`} className={cn("font-semibold transition-colors", !task.enabled && "text-ink/70")}>
                  {task.label}
                </p>
                {task.detail && <p className="mt-0.5 text-sm leading-relaxed text-muted">{task.detail}</p>}
              </div>
              {task.custom && (
                <button
                  type="button"
                  onClick={() => update((d) => ({ ...d, tasks: d.tasks.filter((x) => x.id !== task.id) }))}
                  aria-label={`${t("remove")}: ${task.label}`}
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-raised hover:text-ink"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              )}
              <YesNo checked={task.enabled} onChange={(v) => setTask(task.id, v)} yes={t("yes")} no={t("no")} labelledBy={`task-${task.id}`} />
            </li>
          ))}
        </ul>
        {data.tasks.length < 14 && (
          <form onSubmit={addTask} className="flex items-end gap-2">
            <TextField
              className="flex-1"
              label={t("addLabel")}
              placeholder={t("addPlaceholder")}
              value={custom}
              maxLength={90}
              onChange={(e) => setCustom(e.target.value)}
            />
            <button
              type="submit"
              disabled={!custom.trim()}
              className="flex h-12 items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 text-ui font-semibold transition-colors hover:bg-raised disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden="true" />
              {t("add")}
            </button>
          </form>
        )}
      </div>

      <Section title={t("coverageTitle")}>
        <div className="grid gap-3 md:grid-cols-3">
          {COVERAGE.map(({ key, icon: Icon }) => (
            <ChoiceCard
              key={key}
              name="coverage"
              value={key}
              selected={data.coverage === key}
              onSelect={() => update((d) => ({ ...d, coverage: key }))}
              icon={<Icon className="size-5 text-accent-ink" aria-hidden="true" />}
              title={t(`coverage.${key}.title`)}
              text={t(`coverage.${key}.text`)}
            />
          ))}
        </div>
      </Section>

      <Section title={t("languagesTitle")}>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("languagesTitle")}>
          {LANGS.map((lang) => {
            const on = data.languages.includes(lang);
            return (
              <button
                key={lang}
                type="button"
                aria-pressed={on}
                onClick={() => toggleLang(lang)}
                className={cn(
                  "min-h-11 rounded-full border px-5 text-sm font-semibold transition-colors",
                  on ? "border-transparent bg-cta text-white" : "border-line-strong bg-canvas/50 text-muted hover:text-ink",
                )}
              >
                {t(`languages.${lang}`)}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title={t("handoffTitle")} text={t("handoffText")}>
        <div className="max-w-sm">
          <TextField
            label={t("handoffTitle")}
            className="[&>label]:sr-only"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={t("handoffPlaceholder")}
            value={data.handoffPhone}
            maxLength={30}
            onChange={(e) => update((d) => ({ ...d, handoffPhone: e.target.value }))}
          />
          {(showErrors || data.handoffPhone.length > 8) && phoneInvalid && <FieldError message={t("handoffInvalid")} />}
        </div>
      </Section>
    </div>
  );
}
