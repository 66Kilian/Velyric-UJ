"use client";

import { Bell, CreditCard, Download, KeyRound, Palette, RefreshCcw, ShieldCheck, ShieldAlert, Trash2, UserRoundCog } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { PasswordField } from "@/components/auth/Fields";
import { FormAlert } from "@/components/auth/FormAlert";
import { StrengthMeter } from "@/components/auth/StrengthMeter";
import { Segmented } from "@/components/setup/ui";
import { Button } from "@/components/ui/Button";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { MIN_PASSWORD } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { KINDS, defaultWidgets, type Workspace } from "@/lib/dashboard/schema";
import { DASHBOARD_URL } from "@/lib/dashboard/url";
import { site } from "@/lib/site";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useDashboard } from "../DashboardProvider";
import { PageHeader, useFormat } from "../kit";
import { LookControls, WidgetPicker } from "../Studio";

const SECTIONS = [
  { key: "look", icon: Palette },
  { key: "notify", icon: Bell },
  { key: "security", icon: ShieldCheck },
  { key: "privacy", icon: UserRoundCog },
  { key: "billing", icon: CreditCard },
] as const;

// BEÁLLÍTÁSOK – megjelenés, értesítések, biztonság (2FA, automatikus kilépés, jelszó, napló),
// adatvédelem (megőrzés, export, törlés), számlázás
export function SettingsView() {
  const t = useTranslations("dash.settings");
  const { mode } = useDashboard();
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t("title")} text={t("text")} />
      <div className="grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12">
        <nav aria-label={t("title")} className="lg:sticky lg:top-10 lg:self-start">
          <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 lg:flex-col">
            {SECTIONS.map(({ key, icon: Icon }) => (
              <li key={key}>
                <a href={`#s-${key}`} className="flex h-10 shrink-0 items-center gap-2.5 rounded-xl px-3 text-sm font-medium whitespace-nowrap text-muted transition-colors hover:bg-raised hover:text-ink">
                  <Icon className="size-4" aria-hidden="true" />
                  {t(`${key}.title`)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex min-w-0 flex-col gap-8">
          {mode === "demo" && <FormAlert kind="info">{t("demoNote")}</FormAlert>}
          <LookSection />
          <NotifySection />
          <SecuritySection />
          <PrivacySection />
          <BillingSection />
        </div>
      </div>
    </div>
  );
}

function Card({ id, title, text, children, tone }: { id: string; title: string; text?: string; children: ReactNode; tone?: "danger" }) {
  return (
    <section id={`s-${id}`} aria-labelledby={`h-${id}`} className={cn("dash-panel scroll-mt-24 rounded-media border bg-surface/80 p-5 shadow-float backdrop-blur-xl sm:p-8", tone === "danger" ? "border-danger/30" : "border-line")}>
      <h2 id={`h-${id}`} className="font-display text-2xl font-bold tracking-tight">
        {title}
      </h2>
      {text && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">{text}</p>}
      <div className="mt-6 flex flex-col gap-8">{children}</div>
    </section>
  );
}

function Toggle({ label, text, checked, onChange, disabled }: { label: string; text?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={cn("flex items-start justify-between gap-6", disabled ? "opacity-60" : "cursor-pointer")}>
      <span>
        <span className="block font-semibold">{label}</span>
        {text && <span className="mt-0.5 block text-sm text-muted">{text}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span aria-hidden="true" className={cn("relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-ink", checked ? "bg-cta" : "bg-raised")}>
        <span className={cn("absolute top-1 size-5 rounded-full bg-white shadow transition-[left] duration-200", checked ? "left-6" : "left-1")} />
      </span>
    </label>
  );
}

function LookSection() {
  const t = useTranslations("dash.settings.look");
  const ts = useTranslations("dash.studio.home");
  const { workspace, updateWorkspace } = useDashboard();
  const prefs = workspace.prefs;
  return (
    <Card id="look" title={t("title")} text={t("text")}>
      <LookControls />
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold">{ts("kind")}</p>
        <Segmented
          label={ts("kind")}
          value={prefs.kind}
          onChange={(kind) => updateWorkspace((w) => ({ ...w, prefs: { ...w.prefs, kind, widgets: defaultWidgets(kind) } }))}
          options={KINDS.map((k) => ({ value: k, label: ts(`kinds.${k}.name`) }))}
        />
      </div>
      <WidgetPicker prefs={prefs} onChange={(widgets) => updateWorkspace((w) => ({ ...w, prefs: { ...w.prefs, widgets } }))} />
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold">{t("density")}</p>
        <div className="max-w-sm">
          <Segmented
            label={t("density")}
            value={prefs.density}
            onChange={(density) => updateWorkspace((w) => ({ ...w, prefs: { ...w.prefs, density } }))}
            options={[
              { value: "comfortable", label: t("comfortable") },
              { value: "compact", label: t("compact") },
            ]}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-line pt-6">
        <Button variant="secondary" onClick={() => updateWorkspace({ studio_done: false })}>
          <Palette className="size-4" aria-hidden="true" />
          {t("studio")}
        </Button>
        <Button variant="ghost" onClick={() => updateWorkspace({ tour_done: false })}>
          <RefreshCcw className="size-4" aria-hidden="true" />
          {t("tour")}
        </Button>
      </div>
    </Card>
  );
}

function NotifySection() {
  const t = useTranslations("dash.settings.notify");
  const { workspace, updateWorkspace, user } = useDashboard();
  const set = (patch: Partial<Workspace["notify"]>) => updateWorkspace((w) => ({ ...w, notify: { ...w.notify, ...patch } }));
  return (
    <Card id="notify" title={t("title")} text={t("text", { email: user.email })}>
      <Toggle label={t("newIssue")} text={t("newIssueText")} checked={workspace.notify.newIssue} onChange={(v) => set({ newIssue: v })} />
      <Toggle label={t("missedCall")} text={t("missedCallText")} checked={workspace.notify.missedCall} onChange={(v) => set({ missedCall: v })} />
      <Toggle label={t("daily")} text={t("dailyText")} checked={workspace.notify.dailySummary} onChange={(v) => set({ dailySummary: v })} />
    </Card>
  );
}

// ---- Biztonság: kétlépcsős azonosítás, automatikus kilépés, jelszó, napló ----
function SecuritySection() {
  const t = useTranslations("dash.settings.security");
  const { workspace, updateWorkspace, mode } = useDashboard();
  const real = mode === "real";
  return (
    <Card id="security" title={t("title")} text={t("text")}>
      {real ? <MfaBlock /> : <p className="text-sm text-muted">{t("realOnly")}</p>}
      <div className="flex flex-col gap-2">
        <label htmlFor="idle" className="font-semibold">
          {t("idle")}
        </label>
        <p className="text-sm text-muted">{t("idleText")}</p>
        <select
          id="idle"
          value={workspace.idle_minutes}
          onChange={(e) => updateWorkspace({ idle_minutes: Number(e.target.value) as 0 | 15 | 30 | 60 })}
          className="mt-1 h-12 max-w-xs rounded-xl border border-line-strong bg-canvas/70 px-4 text-[16px] outline-none focus:border-brand-pink/70"
        >
          {[15, 30, 60, 0].map((m) => (
            <option key={m} value={m}>
              {m ? t("minutes", { count: m }) : t("never")}
            </option>
          ))}
        </select>
      </div>
      {real && <PasswordBlock />}
      {real && <SecurityLog />}
    </Card>
  );
}

function MfaBlock() {
  const t = useTranslations("dash.settings.security");
  const [state, setState] = useState<"loading" | "off" | "enrolling" | "on">("loading");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSupabaseBrowser()
      ?.auth.mfa.listFactors()
      .then(({ data }) => {
        const verified = data?.totp.find((f) => f.status === "verified");
        setFactorId(verified?.id ?? null);
        setState(verified ? "on" : "off");
      });
  }, []);

  const log = async (type: string) => {
    const supabase = getSupabaseBrowser();
    const { data } = (await supabase?.auth.getUser()) ?? { data: null };
    if (supabase && data?.user) await supabase.from("security_events").insert({ user_id: data.user.id, type });
  };

  const start = async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    // A félbehagyott (nem ellenőrzött) próbálkozásokat töröljük
    const { data: list } = await supabase.auth.mfa.listFactors();
    for (const f of list?.all ?? []) if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
    const { data, error: e } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Velyric ${new Date().toISOString().slice(0, 10)}` });
    setBusy(false);
    if (e || !data) return setError(t("mfaError"));
    setFactorId(data.id);
    setQr(data.totp.qr_code);
    setSecret(data.totp.secret);
    setState("enrolling");
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseBrowser();
    if (!supabase || !factorId || !/^\d{6}$/.test(code)) return setError(t("codeInvalid"));
    setBusy(true);
    const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    setBusy(false);
    if (err) return setError(t("codeInvalid"));
    setError(null);
    setState("on");
    setQr(null);
    setSecret(null);
    void log("mfa_enabled");
  };

  const disable = async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase || !factorId || !window.confirm(t("mfaDisableConfirm"))) return;
    setBusy(true);
    const { error: err } = await supabase.auth.mfa.unenroll({ factorId });
    setBusy(false);
    if (err) return setError(t("mfaAal2"));
    setState("off");
    void log("mfa_disabled");
  };

  return (
    <div className="flex flex-col gap-4 rounded-panel border border-line bg-canvas/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          {state === "on" ? <ShieldCheck className="mt-0.5 size-5 text-success" aria-hidden="true" /> : <ShieldAlert className="mt-0.5 size-5 text-warning" aria-hidden="true" />}
          <div>
            <p className="font-semibold">{t("mfa")}</p>
            <p className="mt-0.5 text-sm text-muted">{state === "on" ? t("mfaOn") : t("mfaText")}</p>
          </div>
        </div>
        {state === "off" && (
          <Button onClick={start} loading={busy} className="h-10">
            <KeyRound className="size-4" aria-hidden="true" />
            {t("mfaEnable")}
          </Button>
        )}
        {state === "on" && (
          <Button variant="secondary" onClick={disable} loading={busy} className="h-10">
            {t("mfaDisable")}
          </Button>
        )}
      </div>
      {state === "enrolling" && qr && (
        <form onSubmit={verify} className="grid gap-5 border-t border-line pt-5 sm:grid-cols-[11rem_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element -- a Supabase adja data: URI-ként */}
          <img src={qr} alt={t("qrAlt")} className="size-44 rounded-xl bg-white p-2" />
          <div className="flex flex-col gap-3">
            <ol className="list-decimal pl-5 text-sm leading-relaxed text-muted">
              <li>{t("mfaStep1")}</li>
              <li>{t("mfaStep2")}</li>
            </ol>
            {secret && (
              <p className="text-xs text-muted">
                {t("mfaSecret")} <code className="rounded bg-raised px-1.5 py-0.5 font-mono text-ink break-all">{secret}</code>
              </p>
            )}
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              aria-label={t("code")}
              placeholder="123456"
              className="tabular h-12 max-w-[12rem] rounded-xl border border-line-strong bg-canvas/70 px-4 text-xl tracking-[0.4em] outline-none focus:border-brand-pink/70"
            />
            <Button type="submit" loading={busy} className="h-10 self-start">
              {t("mfaVerify")}
            </Button>
          </div>
        </form>
      )}
      {error && <FormAlert kind="error">{error}</FormAlert>}
    </div>
  );
}

function PasswordBlock() {
  const t = useTranslations("dash.settings.security");
  const tAuth = useTranslations("auth");
  const { user } = useDashboard();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (next.length < MIN_PASSWORD) return setError(tAuth("errors.passwordShort"));
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    setState("busy");
    // A jelenlegi jelszó újraellenőrzése (ellopott munkamenettel se lehessen jelszót cserélni)
    const { error: reauth } = await supabase.auth.signInWithPassword({ email: user.email, password: current });
    if (reauth) {
      setState("error");
      return setError(t("wrongPassword"));
    }
    const { error: err } = await supabase.auth.updateUser({ password: next });
    if (err) {
      setState("error");
      return setError(err.code === "same_password" ? tAuth("errors.samePassword") : tAuth("errors.generic"));
    }
    await supabase.from("security_events").insert({ user_id: user.id, type: "password_changed" });
    setState("ok");
    setCurrent("");
    setNext("");
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 border-t border-line pt-6">
      <p className="font-semibold">{t("password")}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <PasswordField label={t("currentPassword")} autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        <PasswordField label={t("newPassword")} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)}>
          <StrengthMeter password={next} />
        </PasswordField>
      </div>
      {error && <FormAlert kind="error">{error}</FormAlert>}
      {state === "ok" && <FormAlert kind="success">{t("passwordChanged")}</FormAlert>}
      <Button type="submit" variant="secondary" loading={state === "busy"} disabled={!current || !next} className="h-10 self-start">
        {t("changePassword")}
      </Button>
    </form>
  );
}

function SecurityLog() {
  const t = useTranslations("dash.settings.security");
  const f = useFormat();
  const { user } = useDashboard();
  const [events, setEvents] = useState<{ type: string; created_at: string }[] | null>(null);
  useEffect(() => {
    getSupabaseBrowser()
      ?.from("security_events")
      .select("type, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12)
      .then(({ data }) => setEvents(data ?? []));
  }, [user.id]);
  return (
    <div className="flex flex-col gap-3 border-t border-line pt-6">
      <p className="font-semibold">{t("log")}</p>
      {events?.length ? (
        <ul className="flex flex-col divide-y divide-line text-sm">
          {events.map((e, i) => (
            <li key={i} className="flex justify-between gap-4 py-2.5">
              <span>{t.has(`events.${e.type}` as "events.login") ? t(`events.${e.type}` as "events.login") : e.type}</span>
              <span className="tabular text-muted">{f.short(e.created_at)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">{events ? t("logEmpty") : "…"}</p>
      )}
    </div>
  );
}

// ---- Adatvédelem: megőrzés, adatfeldolgozási hozzájárulás, export, fióktörlés ----
function PrivacySection() {
  const t = useTranslations("dash.settings.privacy");
  const locale = useLocale() as Locale;
  const { workspace, updateWorkspace, mode, user } = useDashboard();
  const f = useFormat();
  const real = mode === "real";
  const [deleting, setDeleting] = useState(false);
  const legal = (href: "/adatvedelem" | "/aszf") => `${DASHBOARD_URL ? site.url : ""}${getPathname({ locale, href })}`;

  return (
    <>
      <Card id="privacy" title={t("title")} text={t("text")}>
        <div className="flex flex-col gap-2">
          <label htmlFor="retention-s" className="font-semibold">
            {t("retention")}
          </label>
          <p className="text-sm text-muted">{t("retentionText")}</p>
          <select
            id="retention-s"
            value={workspace.retention_days}
            onChange={(e) => updateWorkspace({ retention_days: Number(e.target.value) as 30 | 90 | 180 | 365 })}
            className="mt-1 h-12 max-w-xs rounded-xl border border-line-strong bg-canvas/70 px-4 text-[16px] outline-none focus:border-brand-pink/70"
          >
            {[30, 90, 180, 365].map((d) => (
              <option key={d} value={d}>
                {t("days", { days: d })}
              </option>
            ))}
          </select>
        </div>
        <div className="rounded-panel border border-line bg-canvas/40 p-5 text-sm">
          <p className="font-semibold">{t("dpa")}</p>
          <p className="mt-1 text-muted">
            {workspace.dpa_accepted_at ? t("dpaAccepted", { version: workspace.dpa_version ?? "", date: f.short(workspace.dpa_accepted_at) }) : t("dpaMissing")}
          </p>
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            <a href={legal("/adatvedelem")} className="font-semibold text-accent-ink hover:underline">
              {t("privacyPolicy")}
            </a>
            <a href={legal("/aszf")} className="font-semibold text-accent-ink hover:underline">
              {t("terms")}
            </a>
          </p>
        </div>
        <div className="flex flex-col gap-3 border-t border-line pt-6">
          <p className="font-semibold">{t("export")}</p>
          <p className="text-sm text-muted">{t("exportText")}</p>
          {real ? (
            <a href="/api/account/export" download className="inline-flex h-10 items-center gap-2 self-start rounded-xl border border-line-strong bg-surface px-5 text-ui font-semibold transition-colors hover:bg-raised">
              <Download className="size-4" aria-hidden="true" />
              {t("exportButton")}
            </a>
          ) : (
            <p className="text-sm text-muted">{t("realOnly")}</p>
          )}
        </div>
      </Card>

      <Card id="danger" title={t("deleteTitle")} text={t("deleteText")} tone="danger">
        {real ? (
          deleting ? (
            <DeleteForm email={user.email} onCancel={() => setDeleting(false)} />
          ) : (
            <Button variant="secondary" onClick={() => setDeleting(true)} className="h-10 self-start border-danger/40 text-danger">
              <Trash2 className="size-4" aria-hidden="true" />
              {t("deleteButton")}
            </Button>
          )
        ) : (
          <p className="text-sm text-muted">{t("realOnly")}</p>
        )}
      </Card>
    </>
  );
}

function DeleteForm({ email, onCancel }: { email: string; onCancel: () => void }) {
  const t = useTranslations("dash.settings.privacy");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmEmail, password }),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      window.location.assign(site.url);
      return;
    }
    const code = ((await res?.json().catch(() => ({}))) as { error?: string })?.error;
    setError(code === "email_mismatch" ? t("emailMismatch") : code === "wrong_password" ? t("wrongPassword") : t("deleteError"));
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <FormAlert kind="error">{t("deleteWarning")}</FormAlert>
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium">{t("typeEmail", { email })}</span>
        <input ref={ref} value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} autoComplete="off" className="h-12 rounded-xl border border-line-strong bg-canvas/70 px-4 text-[16px] outline-none focus:border-danger/70" />
      </label>
      <PasswordField label={t("password")} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <FormAlert kind="error">{error}</FormAlert>}
      <div className="flex gap-2">
        <Button type="submit" loading={busy} disabled={confirmEmail.trim().toLowerCase() !== email.toLowerCase()} className="h-10 [background:var(--danger)] text-white">
          {t("deleteConfirm")}
        </Button>
        <Button variant="ghost" onClick={onCancel} className="h-10">
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}

function BillingSection() {
  const t = useTranslations("dash.settings.billing");
  const locale = useLocale() as Locale;
  const { paid, mode } = useDashboard();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setupHref = `${DASHBOARD_URL ? site.url : ""}${getPathname({ locale, href: "/beallitas" })}?szerkesztes=1`;

  const portal = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/billing/portal", { method: "POST" }).catch(() => null);
    const data = (await res?.json().catch(() => null)) as { url?: string } | null;
    if (res?.ok && data?.url?.startsWith("https://billing.stripe.com/")) return window.location.assign(data.url);
    setBusy(false);
    setError(t("portalError"));
  };

  return (
    <Card id="billing" title={t("title")} text={t("text")}>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-panel border border-line bg-canvas/40 p-5">
        <div>
          <p className="font-semibold">{t("plan")}</p>
          <p className={cn("mt-0.5 text-sm", paid ? "text-success" : "text-muted")}>{paid ? t("active") : mode === "demo" ? t("demo") : t("inactive")}</p>
        </div>
        {mode === "real" && (
          <Button variant="secondary" onClick={portal} loading={busy} className="h-10">
            <CreditCard className="size-4" aria-hidden="true" />
            {t("portal")}
          </Button>
        )}
      </div>
      {error && <FormAlert kind="error">{error}</FormAlert>}
      <a href={setupHref} className="self-start text-sm font-semibold text-accent-ink hover:underline">
        {t("setup")}
      </a>
    </Card>
  );
}
