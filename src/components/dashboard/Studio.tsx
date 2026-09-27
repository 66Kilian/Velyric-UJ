"use client";

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CalendarDays, Check, ListChecks, ShieldCheck, UtensilsCrossed } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FieldError, Segmented } from "@/components/setup/ui";
import { Orb } from "@/components/setup/Guide";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { ACCENTS, DPA_VERSION, KINDS, STYLES, WIDGETS, defaultWidgets, type Prefs, type WidgetKey } from "@/lib/dashboard/schema";
import { ACCENT_PRESETS } from "@/lib/dashboard/theme";
import { useDashboard } from "./DashboardProvider";
import { useKindLabels } from "./Shell";

const KIND_ICON = { appointments: CalendarDays, reservations: UtensilsCrossed, cases: ListChecks } as const;

// STÚDIÓ – az első belépéskor a felhasználó maga rakja össze a kezelőjét:
// stílus, mód, szín → mit lásson a főoldalon → adatvédelem. Minden választás azonnal él.
export function Studio({ onDone }: { onDone: () => void }) {
  const t = useTranslations("dash.studio");
  const { workspace, updateWorkspace, onboarding } = useDashboard();
  const [step, setStep] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [showError, setShowError] = useState(false);
  const prefs = workspace.prefs;
  const setPrefs = (patch: Partial<Prefs>) => updateWorkspace((w) => ({ ...w, prefs: { ...w.prefs, ...patch } }));

  const finish = () => {
    if (!accepted) return setShowError(true);
    updateWorkspace((w) => ({ ...w, studio_done: true, dpa_version: DPA_VERSION, dpa_accepted_at: new Date().toISOString() }));
    onDone();
  };

  const steps = ["look", "home", "privacy"] as const;

  return (
    <div className="relative isolate min-h-dvh overflow-x-clip">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="cloud-float absolute -top-48 right-[-8%] h-[42rem] w-[50rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--pink)_20%,transparent),transparent)] blur-3xl" />
        <div className="cloud-float-slow absolute bottom-[-18rem] left-[-5%] h-[38rem] w-[52rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--magenta)_12%,transparent),transparent)] blur-3xl" />
      </div>

      <div className="mx-auto grid min-h-dvh w-full max-w-[90rem] gap-10 px-5 py-8 sm:px-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:px-14">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <Orb />
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-accent-ink uppercase">{t("eyebrow")}</p>
              <p className="text-sm text-muted">{t("progress", { current: step + 1, total: steps.length })}</p>
            </div>
          </div>

          <div key={step} className="rise-in mt-10 flex-1">
            <h1 className="font-display text-[clamp(2.2rem,1.5rem+2.4vw,3.4rem)] leading-[1.04] font-bold tracking-[-0.02em] text-balance">
              {t(`${steps[step]}.title`, { name: onboarding.voice.agentName })}
            </h1>
            <p className="mt-4 max-w-xl text-lead text-muted">{t(`${steps[step]}.text`)}</p>

            {step === 0 && <LookControls className="mt-10" />}

            {step === 1 && (
              <div className="mt-10 flex flex-col gap-9">
                <fieldset>
                  <legend className="text-sm font-semibold">{t("home.kind")}</legend>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {KINDS.map((k) => {
                      const Icon = KIND_ICON[k];
                      return (
                        <button
                          key={k}
                          type="button"
                          aria-pressed={prefs.kind === k}
                          onClick={() => setPrefs({ kind: k, widgets: defaultWidgets(k) })}
                          className={cn(
                            "flex flex-col gap-2 rounded-panel border p-4 text-left transition-[border-color,box-shadow]",
                            prefs.kind === k ? "border-brand shadow-lift" : "border-line-strong bg-surface/40 hover:border-ink/25",
                          )}
                        >
                          <Icon className="size-5 text-accent-ink" aria-hidden="true" />
                          <span className="font-semibold">{t(`home.kinds.${k}.name`)}</span>
                          <span className="text-xs leading-relaxed text-muted">{t(`home.kinds.${k}.text`)}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                <WidgetPicker prefs={prefs} onChange={(widgets) => setPrefs({ widgets })} />
              </div>
            )}

            {step === 2 && (
              <div className="mt-10 flex flex-col gap-7">
                <ul className="flex flex-col gap-3">
                  {(t.raw("privacy.points") as string[]).map((p) => (
                    <li key={p} className="flex gap-3 text-sm leading-relaxed">
                      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                      {p}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-2">
                  <label htmlFor="retention" className="text-sm font-semibold">
                    {t("privacy.retention")}
                  </label>
                  <select
                    id="retention"
                    value={workspace.retention_days}
                    onChange={(e) => updateWorkspace({ retention_days: Number(e.target.value) as 30 | 90 | 180 | 365 })}
                    className="h-12 max-w-xs rounded-xl border border-line-strong bg-canvas/70 px-4 text-[16px] outline-none focus:border-brand-pink/70"
                  >
                    {[30, 90, 180, 365].map((d) => (
                      <option key={d} value={d}>
                        {t("privacy.days", { days: d })}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted">{t("privacy.retentionHint")}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="flex cursor-pointer items-start gap-3 rounded-panel border border-line-strong bg-surface/40 p-4 text-sm leading-relaxed">
                    <input
                      type="checkbox"
                      checked={accepted}
                      onChange={(e) => setAccepted(e.target.checked)}
                      className="mt-0.5 size-5 shrink-0 accent-[var(--pink)]"
                    />
                    <span>{t("privacy.accept", { version: DPA_VERSION })}</span>
                  </label>
                  {showError && !accepted && <FieldError message={t("privacy.required")} />}
                </div>
              </div>
            )}
          </div>

          <div className="mt-12 flex items-center justify-between gap-3 border-t border-line pt-6">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)} className="px-3">
                <ArrowLeft className="size-4" aria-hidden="true" />
                {t("back")}
              </Button>
            ) : (
              <span />
            )}
            {step < steps.length - 1 ? (
              <Button size="lg" onClick={() => setStep(step + 1)}>
                {t("next")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button size="lg" onClick={finish}>
                {t("finish")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>

        {/* ---- Élő előnézet ---- */}
        <div className="hidden lg:block">
          <div className="sticky top-12">
            <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
              <span className="live-dot size-1.5 rounded-full bg-success" aria-hidden="true" />
              {t("preview")}
            </p>
            <MiniDashboard
              prefs={prefs}
              business={onboarding.profile?.businessName || onboarding.business.name}
              agent={onboarding.voice.agentName}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Megjelenés: stílus, mód, szín (a Stúdióban és a Beállításokban is)
export function LookControls({ className }: { className?: string }) {
  const t = useTranslations("dash.studio");
  const { workspace, updateWorkspace } = useDashboard();
  const prefs = workspace.prefs;
  const setPrefs = (patch: Partial<Prefs>) => updateWorkspace((w) => ({ ...w, prefs: { ...w.prefs, ...patch } }));
  return (
    <div className={cn("flex flex-col gap-9", className)}>
      <fieldset>
        <legend className="text-sm font-semibold">{t("look.style")}</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {STYLES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={prefs.style === s}
              onClick={() => setPrefs({ style: s })}
              className={cn(
                "flex flex-col gap-3 rounded-panel border p-4 text-left transition-[border-color,box-shadow]",
                prefs.style === s ? "border-brand shadow-lift" : "border-line-strong bg-surface/40 hover:border-ink/25",
              )}
            >
              <StyleThumb style={s} />
              <span>
                <span className={cn("block text-lg font-semibold", s === "classic" && "font-[family-name:var(--font-serif)] text-xl")}>
                  {t(`look.styles.${s}.name`)}
                </span>
                <span className="text-xs text-muted">{t(`look.styles.${s}.text`)}</span>
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">{t("look.mode")}</legend>
        <div className="mt-3 max-w-sm">
          <Segmented
            label={t("look.mode")}
            value={prefs.mode}
            onChange={(mode) => setPrefs({ mode })}
            options={[
              { value: "dark", label: `☾  ${t("look.dark")}` },
              { value: "light", label: `☀  ${t("look.light")}` },
            ]}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">{t("look.accent")}</legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {ACCENTS.map((a) => {
            const p = ACCENT_PRESETS[a];
            return (
              <button
                key={a}
                type="button"
                aria-pressed={prefs.accent === a}
                aria-label={t(`look.accents.${a}`)}
                title={t(`look.accents.${a}`)}
                onClick={() => setPrefs({ accent: a })}
                className={cn(
                  "group flex flex-col items-center gap-2 rounded-2xl p-2 transition-colors",
                  prefs.accent === a ? "bg-raised" : "hover:bg-raised/50",
                )}
              >
                <span
                  className={cn(
                    "relative flex size-12 items-center justify-center rounded-full ring-offset-2 ring-offset-[var(--canvas)] transition-shadow",
                    prefs.accent === a && "ring-2 ring-[var(--ink)]",
                  )}
                  style={{ background: `linear-gradient(135deg, ${p.stops[0]}, ${p.stops[1]} 50%, ${p.stops[2]})` }}
                >
                  {prefs.accent === a && <Check className="size-5" style={{ color: p.onAccent }} strokeWidth={3} aria-hidden="true" />}
                </span>
                <span className="text-xs font-medium text-muted">{t(`look.accents.${a}`)}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

// Kezdőlap-dobozok: be/ki és sorrend (fel/le gombokkal – billentyűzettel is kezelhető)
export function WidgetPicker({ prefs, onChange }: { prefs: Prefs; onChange: (w: WidgetKey[]) => void }) {
  const t = useTranslations("dash.studio.home");
  const tw = useTranslations("dash.widgets");
  const kl = useKindLabels();
  const kindVars = { issues: kl.issues, bookings: kl.bookings ?? "" };
  const available = WIDGETS.filter((w) => !(w === "bookings" && prefs.kind === "cases"));
  const ordered = [...prefs.widgets.filter((w) => available.includes(w)), ...available.filter((w) => !prefs.widgets.includes(w))];
  const move = (w: WidgetKey, dir: -1 | 1) => {
    const list = prefs.widgets.filter((x) => available.includes(x));
    const i = list.indexOf(w);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    onChange(list);
  };
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{t("widgets")}</legend>
      <p className="mt-1 text-xs text-muted">{t("widgetsHint")}</p>
      <ul className="mt-3 flex flex-col gap-2">
        {ordered.map((w) => {
          const on = prefs.widgets.includes(w);
          const idx = prefs.widgets.indexOf(w);
          return (
            <li
              key={w}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                on ? "border-line-strong bg-surface/60" : "border-line bg-transparent opacity-70",
              )}
            >
              <label className="flex flex-1 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(e) => onChange(e.target.checked ? [...prefs.widgets, w] : prefs.widgets.filter((x) => x !== w))}
                  className="size-5 accent-[var(--pink)]"
                />
                <span>
                  <span className="block text-sm font-semibold">{tw(`${w}.title`, kindVars)}</span>
                  <span className="block text-xs text-muted">{tw(`${w}.hint`)}</span>
                </span>
              </label>
              {on && (
                <span className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(w, -1)}
                    disabled={idx <= 0}
                    aria-label={`${tw(`${w}.title`, kindVars)}: ${t("up")}`}
                    className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-raised hover:text-ink disabled:opacity-30"
                  >
                    <ArrowUp className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(w, 1)}
                    disabled={idx === prefs.widgets.length - 1}
                    aria-label={`${tw(`${w}.title`, kindVars)}: ${t("down")}`}
                    className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-raised hover:text-ink disabled:opacity-30"
                  >
                    <ArrowDown className="size-4" aria-hidden="true" />
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

function StyleThumb({ style }: { style: Prefs["style"] }) {
  const r = style === "modern" ? "rounded-lg" : style === "classic" ? "rounded-md" : "rounded-sm";
  return (
    <span
      aria-hidden="true"
      className={cn("flex h-20 gap-1.5 bg-canvas/80 p-2", r, style === "minimal" ? "border border-line-strong" : "shadow-float")}
    >
      <span className={cn("w-5 bg-raised", r)} />
      <span className="flex flex-1 flex-col gap-1.5">
        <span className={cn("h-3 w-2/3", r, style === "classic" ? "bg-ink/50" : "bg-ink/30")} />
        <span className="flex flex-1 gap-1.5">
          <span className={cn("flex-1 bg-brand opacity-80", r)} />
          <span className={cn("flex-1 bg-raised", r)} />
        </span>
      </span>
    </span>
  );
}

// Kicsinyített kezelő a választott megjelenéssel és dobozokkal
function MiniDashboard({ prefs, business, agent }: { prefs: Prefs; business: string; agent: string }) {
  const tw = useTranslations("dash.widgets");
  const kl = useKindLabels();
  const kindVars = { issues: kl.issues, bookings: kl.bookings ?? "" };
  return (
    <div className="overflow-hidden rounded-media border border-line-strong bg-canvas shadow-lift">
      <div className="flex">
        <div className="flex w-40 shrink-0 flex-col gap-2 border-r border-line bg-surface/60 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="size-6 rounded-md bg-cta" />
            <span className="truncate font-display text-xs font-semibold">{business}</span>
          </div>
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className={cn("h-6 rounded-md", i === 0 ? "bg-raised" : "bg-raised/30")} />
          ))}
          <div className="mt-auto flex items-center gap-2 rounded-lg border border-line p-2">
            <span className="size-5 rounded-full bg-brand" />
            <span className="truncate text-[10px] font-semibold">{agent}</span>
          </div>
        </div>
        <div className="min-h-[30rem] flex-1 p-5">
          <p className="font-display text-lg font-bold">{business}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {prefs.widgets.map((w, i) => (
              <div
                key={w}
                className={cn(
                  "rise-in rounded-panel border border-line bg-surface p-3 shadow-float",
                  (w === "stats" || w === "volume" || (i === 0 && w === "live")) && "col-span-2",
                )}
              >
                <p className="text-[10px] font-semibold tracking-[0.12em] text-muted uppercase">{tw(`${w}.title`, kindVars)}</p>
                {w === "stats" ? (
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {[0, 1, 2, 3].map((k) => (
                      <span key={k} className="h-9 rounded-md bg-raised" />
                    ))}
                  </div>
                ) : w === "volume" ? (
                  <div className="mt-2 flex h-12 items-end gap-1.5">
                    {[40, 65, 50, 80, 72, 95, 60].map((h, k) => (
                      <span key={k} className="flex-1 rounded-t-[3px] bg-[var(--pink)]" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 flex flex-col gap-1.5">
                    <span className="h-2 w-5/6 rounded bg-raised" />
                    <span className="h-2 w-2/3 rounded bg-raised" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
