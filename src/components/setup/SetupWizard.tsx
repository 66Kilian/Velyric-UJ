"use client";

import { ArrowLeft, ArrowRight, Check, CloudOff, Eye, LogOut, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { LanguageDropdown } from "@/components/nav/LanguageSwitcher";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useSignOut } from "@/hooks/useSignOut";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { getDemoUser } from "@/lib/demo";
import { loadOnboarding, saveOnboarding, verifyCheckout } from "@/lib/onboarding/client";
import { STEPS, type AnalyzeResult, type OnboardingData } from "@/lib/onboarding/schema";
import { billingErrors, isValidPhone } from "@/lib/onboarding/validate";
import type { PlanInfo } from "@/lib/server/stripe";
import { site } from "@/lib/site";
import { dashboardHref } from "@/lib/dashboard/url";
import { AgentPreview } from "./AgentPreview";
import { Guide } from "./Guide";
import { BillingStep } from "./steps/BillingStep";
import { BusinessStep } from "./steps/BusinessStep";
import { DoneStep } from "./steps/DoneStep";
import { KnowledgeStep } from "./steps/KnowledgeStep";
import { PaymentStep } from "./steps/PaymentStep";
import { TasksStep } from "./steps/TasksStep";
import { VoiceStep } from "./steps/VoiceStep";
import type { Update } from "./types";

type Props = {
  user: { id: string; email: string } | null;
  initial: OnboardingData | null;
  serverPaid: boolean;
  plan: PlanInfo;
  aiMode: "ai" | "template";
};

type SaveState = "idle" | "saving" | "saved" | "error";

const LAST = STEPS.length - 1; // „Kész”
const VISIBLE = STEPS.slice(0, LAST); // a sávon látható 6 lépés

const markDone = (d: OnboardingData, status: OnboardingData["payment"]["status"]): OnboardingData => ({
  ...d,
  payment: { status },
  completedAt: d.completedAt ?? new Date().toISOString(),
  step: LAST,
  maxStep: LAST,
});

// A BEÁLLÍTÁS vezérlője: állapot, mentés, lépések, MI-kísérő, élő előnézet
export function SetupWizard({ user, initial, serverPaid, plan, aiMode }: Props) {
  const t = useTranslations("setup");
  const tBrand = useTranslations("brand");
  const locale = useLocale();
  const router = useRouter();
  const signOut = useSignOut();

  const [data, setData] = useState<OnboardingData | null>(() =>
    initial && serverPaid && initial.payment.status !== "paid" ? markDone(initial, "paid") : initial,
  );
  const [email, setEmail] = useState(user?.email ?? "");
  const [analyzedFrom, setAnalyzedFrom] = useState<string | null>(initial?.profile ? initial.business.description.trim() : null);
  const [showErrors, setShowErrors] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [speaking, setSpeaking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const loaded = useRef(false);
  const previewRef = useRef<HTMLDialogElement>(null);

  const update: Update = useCallback((fn) => setData((d) => (d ? fn(d) : d)), []);

  // Bemutató mód: a teszt fiók a böngészőben él → onnan töltünk; ha nincs belépve, a bejelentkezésre
  useEffect(() => {
    if (user) return;
    const demoEmail = getDemoUser();
    if (!demoEmail) {
      router.replace("/bejelentkezes");
      return;
    }
    loadOnboarding(null, demoEmail).then((d) => {
      if (d.completedAt && !new URLSearchParams(window.location.search).has("szerkesztes")) {
        window.location.assign(dashboardHref(locale));
        return;
      }
      setEmail(demoEmail);
      setAnalyzedFrom(d.profile ? d.business.description.trim() : null);
      setData(d);
    });
  }, [user, router, locale]);

  // Visszatérés a Stripe fizetőoldaláról
  useEffect(() => {
    const url = new URL(window.location.href);
    const result = url.searchParams.get("fizetes");
    if (!result) return;
    const sessionId = url.searchParams.get("session_id");
    url.searchParams.delete("fizetes");
    url.searchParams.delete("session_id");
    history.replaceState(null, "", url.pathname + url.search);
    const frame = requestAnimationFrame(() => {
      if (result === "siker" && sessionId) {
        setNotice(t("payment.verifying"));
        verifyCheckout(sessionId)
          .then(({ paid }) => {
            if (paid) {
              setNotice(null);
              update((d) => markDone(d, "paid"));
            } else setNotice(t("payment.notPaid"));
          })
          .catch(() => setNotice(t("payment.notPaid")));
      } else {
        setNotice(t("payment.cancelled"));
        update((d) => ({ ...d, step: 5 }));
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [t, update]);

  // Automatikus mentés (kis késleltetéssel, hogy gépelés közben ne mentsen minden betűnél)
  useEffect(() => {
    if (!data) return;
    if (!loaded.current) {
      loaded.current = true;
      return;
    }
    const pending = requestAnimationFrame(() => setSaveState("saving"));
    const id = window.setTimeout(async () => {
      const ok = await saveOnboarding(user?.id ?? null, email, data);
      setSaveState(ok ? "saved" : "error");
    }, 700);
    return () => {
      cancelAnimationFrame(pending);
      window.clearTimeout(id);
    };
  }, [data, user, email]);

  const step = data?.step ?? 0;

  // Lépésváltáskor: az oldal tetejére, a fókusz a címre (képernyőolvasónak is egyértelmű)
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const goTo = useCallback(
    (target: number) => {
      setShowErrors(false);
      update((d) => (target <= d.maxStep || target <= d.step ? { ...d, step: target } : d));
    },
    [update],
  );

  if (!data) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas text-muted" role="status">
        <Spinner />
      </div>
    );
  }

  const stepKey = STEPS[step];

  // Továbblépés feltétele lépésenként
  const valid = (() => {
    switch (stepKey) {
      case "business":
        return !!data.profile;
      case "tasks":
        return data.tasks.some((x) => x.enabled) && (!data.handoffPhone.trim() || isValidPhone(data.handoffPhone));
      case "voice":
        return !!data.voice.greeting.trim() && !!data.voice.agentName.trim();
      case "billing":
        return Object.keys(billingErrors(data.billing)).length === 0;
      default:
        return true;
    }
  })();

  const next = () => {
    if (!valid) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    update((d) => ({ ...d, step: d.step + 1, maxStep: Math.max(d.maxStep, d.step + 1) }));
  };

  const onAnalyzed = (result: AnalyzeResult, description: string) => {
    setAnalyzedFrom(description);
    update((d) => {
      const name = d.voice.agentName;
      const swap = (s: string) => (name && name !== "Luca" ? s.split("Luca").join(name) : s);
      return {
        ...d,
        business: { ...d.business, name: d.business.name || result.profile.businessName },
        profile: result.profile,
        tasks: result.tasks,
        voice: { ...d.voice, greeting: swap(result.greeting), closing: swap(result.closing) },
      };
    });
  };

  const onLogout = async () => {
    await signOut();
    router.replace("/");
  };

  const guideText = (() => {
    if (stepKey === "business") return aiMode === "template" ? `${t("guide.welcome")} ${t("guide.templateNote")}` : t("guide.welcome");
    const tips = data.profile?.tips;
    if (!tips) return null;
    if (stepKey === "tasks") return tips.tasks;
    if (stepKey === "voice") return tips.voice;
    if (stepKey === "knowledge") return tips.knowledge;
    return null;
  })();

  const common = { data, update, aiMode, userId: user?.id ?? null, goTo };
  const isDone = stepKey === "done";

  return (
    <div className="relative isolate min-h-dvh overflow-x-clip bg-canvas">
      <SetupBackdrop />

      {/* ---- Fejléc ---- */}
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/75 backdrop-blur-xl">
        <div className="mx-auto flex h-[var(--nav-h)] w-full max-w-7xl items-center justify-between gap-3 px-5 sm:px-8 lg:px-12">
          <Link href="/" aria-label={tBrand("homeLabel")} className="rounded-lg">
            <Logo size="md" eager />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <SaveIndicator state={saveState} />
            <LanguageDropdown className="hidden sm:block" />
            <span className="hidden max-w-48 truncate px-2 text-sm text-muted md:inline" title={email}>
              {email}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="flex size-12 items-center justify-center rounded-xl text-muted transition-colors hover:bg-raised hover:text-ink"
              aria-label={t("header.logout")}
              title={t("header.logout")}
            >
              <LogOut className="size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main id="tartalom" className="mx-auto grid w-full max-w-7xl gap-10 px-5 pt-8 pb-16 sm:px-8 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14 lg:px-12 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0">
          {!isDone && <StepRail current={step} maxStep={data.maxStep} onSelect={goTo} />}

          <div key={stepKey} className="rise-in mt-10 flex flex-col gap-8 sm:mt-12">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-accent-ink uppercase">
                {isDone ? t("done.eyebrow") : t("steps.progress", { current: step + 1, total: VISIBLE.length })}
              </p>
              <h1
                ref={headingRef}
                tabIndex={-1}
                className="mt-3 text-[clamp(2rem,1.4rem+2.2vw,3.1rem)] leading-[1.06] font-bold tracking-[-0.03em] text-balance outline-none"
              >
                {isDone ? t("done.title", { agent: data.voice.agentName }) : t(`${stepKey}.title`)}
              </h1>
              <p className="mt-4 max-w-2xl text-lead text-pretty text-muted">{t(`${stepKey}.lead`)}</p>
            </div>

            {guideText && <Guide text={guideText} />}

            {stepKey === "business" && <BusinessStep {...common} analyzedFrom={analyzedFrom} onAnalyzed={onAnalyzed} />}
            {stepKey === "tasks" && <TasksStep {...common} showErrors={showErrors} />}
            {stepKey === "voice" && <VoiceStep {...common} showErrors={showErrors} onSpeaking={setSpeaking} />}
            {stepKey === "knowledge" && <KnowledgeStep {...common} />}
            {stepKey === "billing" && <BillingStep {...common} showErrors={showErrors} />}
            {stepKey === "payment" && (
              <PaymentStep {...common} plan={plan} notice={notice} onFinishDemo={() => update((d) => markDone(d, "demo"))} />
            )}
            {isDone && <DoneStep {...common} onSpeaking={setSpeaking} />}

            {/* ---- Léptetés ---- */}
            {!isDone && (
              <div className="sticky bottom-0 z-20 -mx-5 flex flex-col gap-3 border-t border-line bg-canvas/85 px-5 py-4 backdrop-blur-xl sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
                {showErrors && !valid && stepKey !== "business" && (
                  <p className="text-sm text-danger" role="alert">
                    {t("nav.fixErrors")}
                  </p>
                )}
                <div className="flex items-center justify-between gap-3 sm:border-t sm:border-line sm:pt-8">
                  {step > 0 ? (
                    <Button variant="ghost" onClick={() => goTo(step - 1)} className="px-3">
                      <ArrowLeft className="size-4" aria-hidden="true" />
                      {t("nav.back")}
                    </Button>
                  ) : (
                    <span />
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewOpen(true)}
                      className="flex h-12 items-center gap-2 rounded-xl border border-line-strong px-4 text-ui font-semibold lg:hidden"
                    >
                      <Eye className="size-4" aria-hidden="true" />
                      <span className="sr-only sm:not-sr-only">{t("preview.open")}</span>
                    </button>
                    {stepKey !== "payment" && (
                      <Button size="lg" onClick={next} disabled={stepKey === "business" && !valid} className="min-w-36">
                        {stepKey === "knowledge" && !data.knowledge.later && !data.knowledge.files.length && !data.knowledge.hours && !data.knowledge.notes
                          ? t("nav.skip")
                          : t("nav.next")}
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ---- Élő előnézet (asztalon oldalt, mobilon ablakban) ---- */}
        <div className="hidden lg:block">
          <div className="sticky top-[calc(var(--nav-h)+2rem)] flex flex-col gap-4">
            <AgentPreview data={data} speaking={speaking} />
            <p className="px-2 text-center text-xs text-muted">
              {t("header.help")}{" "}
              <a href={site.phoneHref} className="font-semibold text-ink underline-offset-4 hover:underline">
                {site.phone}
              </a>
            </p>
          </div>
        </div>
      </main>

      {previewOpen && (
        <MobilePreview dialogRef={previewRef} onClose={() => setPreviewOpen(false)} label={t("preview.title")}>
          <AgentPreview data={data} speaking={speaking} className="shadow-none" />
        </MobilePreview>
      )}
    </div>
  );
}

// ---- Lépéssáv: kész lépések pipával és visszakattinthatók ----
function StepRail({ current, maxStep, onSelect }: { current: number; maxStep: number; onSelect: (i: number) => void }) {
  const t = useTranslations("setup.steps");
  return (
    <nav aria-label={t("rail")}>
      <div className="h-1 overflow-hidden rounded-full bg-line-strong sm:hidden" aria-hidden="true">
        <div className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out" style={{ width: `${((current + 1) / VISIBLE.length) * 100}%` }} />
      </div>
      <ol className="hidden gap-2 sm:grid" style={{ gridTemplateColumns: `repeat(${VISIBLE.length}, minmax(0, 1fr))` }}>
        {VISIBLE.map((key, i) => {
          const reachable = i <= maxStep;
          const isCurrent = i === current;
          return (
            <li key={key}>
              <button
                type="button"
                disabled={!reachable || isCurrent}
                onClick={() => onSelect(i)}
                aria-current={isCurrent ? "step" : undefined}
                className="group flex w-full flex-col gap-2.5 text-left disabled:cursor-default"
              >
                <span
                  className={cn(
                    "h-1 w-full rounded-full transition-colors duration-500",
                    isCurrent || i < current ? "bg-brand" : reachable ? "bg-ink/35" : "bg-line-strong",
                  )}
                />
                <span
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-semibold transition-colors",
                    isCurrent ? "text-ink" : reachable ? "text-muted group-hover:text-ink" : "text-muted/60",
                  )}
                >
                  {i < current ? <Check className="size-3.5 text-success" strokeWidth={3} aria-hidden="true" /> : <span className="tabular">{i + 1}.</span>}
                  {t(key)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  const t = useTranslations("setup.header");
  if (state === "idle") return null;
  return (
    <span className="mr-1 flex items-center gap-1.5 text-xs font-medium text-muted" aria-live="polite">
      {state === "saving" && <Spinner className="size-3.5" />}
      {state === "saved" && <Check className="size-3.5 text-success" strokeWidth={3} aria-hidden="true" />}
      {state === "error" && <CloudOff className="size-3.5 text-danger" aria-hidden="true" />}
      <span className={cn(state !== "error" && "hidden sm:inline")}>
        {state === "saving" ? t("saving") : state === "saved" ? t("saved") : t("saveFailed")}
      </span>
    </span>
  );
}

function MobilePreview({
  dialogRef,
  onClose,
  label,
  children,
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    dialogRef.current?.showModal();
  }, [dialogRef]);
  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && dialogRef.current?.close()}
      className="dialog-panel m-auto w-[min(94vw,420px)] rounded-media bg-transparent p-0 text-ink"
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label={label}
          className="absolute top-3 right-3 z-10 flex size-11 items-center justify-center rounded-xl text-muted hover:bg-raised hover:text-ink"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
        {children}
      </div>
    </dialog>
  );
}

// Háttér: lágy, lassan sodródó rózsaszín–magenta „felhők” (csak dekoráció)
function SetupBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="cloud-float absolute -top-40 -right-32 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(closest-side,rgb(255_0_122/0.22),transparent)] blur-2xl" />
      <div className="cloud-float-slow absolute top-1/3 -left-48 h-[32rem] w-[40rem] rounded-full bg-[radial-gradient(closest-side,rgb(240_0_255/0.14),transparent)] blur-2xl" />
      <div className="absolute -bottom-48 left-1/3 h-[30rem] w-[44rem] rounded-full bg-[radial-gradient(closest-side,rgb(255_122_89/0.1),transparent)] blur-2xl" />
    </div>
  );
}
