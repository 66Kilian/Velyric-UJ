"use client";

import { CalendarCheck, CircleAlert, CircleCheck, Eye, FlaskConical, PhoneForwarded, PhoneMissed, RotateCcw, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { maskPhone, type Call } from "@/lib/dashboard/schema";
import { useDashboard } from "./DashboardProvider";

// A kezelő közös építőkövei: oldalfejléc, doboz, üres állapot, címkék, időformázás, hívás-részletek

export function PageHeader({ title, text, actions }: { title: ReactNode; text?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-[clamp(1.9rem,1.4rem+1.6vw,2.8rem)] leading-[1.08] font-bold tracking-[-0.02em]">{title}</h1>
        {text && <p className="mt-2 max-w-2xl text-muted">{text}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className, tour, id }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; tour?: string; id?: string }) {
  return (
    <section
      data-tour={tour}
      aria-labelledby={id}
      className={cn("dash-panel flex min-w-0 flex-col rounded-panel border border-line bg-surface/80 p-5 shadow-float backdrop-blur-xl sm:p-6", className)}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && (
            <h2 id={id} className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Empty({ icon, title, text }: { icon: ReactNode; title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-raised text-accent-ink">{icon}</span>
      <p className="font-semibold">{title}</p>
      {text && <p className="max-w-xs text-sm text-muted">{text}</p>}
    </div>
  );
}

// „Mintaadat” jelzés – valódi fióknál kikapcsolható, amint van saját hívás
export function SampleBanner() {
  const t = useTranslations("dash.sample");
  const { sample, mode, hasRealData, setSample } = useDashboard();
  if (!sample) {
    return mode === "real" && !hasRealData ? (
      <button type="button" onClick={() => setSample(true)} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink">
        <Eye className="size-3.5" aria-hidden="true" />
        {t("show")}
      </button>
    ) : null;
  }
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-panel border border-dashed border-line-strong bg-surface/50 px-4 py-3 text-sm">
      <FlaskConical className="size-4 shrink-0 text-accent-ink" aria-hidden="true" />
      <p className="min-w-0 flex-1 text-muted">
        <span className="font-semibold text-ink">{t("title")}</span> {mode === "demo" ? t("demoText") : t("text")}
      </p>
      {mode === "real" && (
        <button type="button" onClick={() => setSample(false)} className="min-h-9 text-xs font-semibold text-accent-ink hover:underline">
          {t("hide")}
        </button>
      )}
    </div>
  );
}

const OUTCOME = {
  resolved: { icon: CircleCheck, cls: "text-success border-success/30 bg-success/10" },
  booked: { icon: CalendarCheck, cls: "text-success border-success/30 bg-success/10" },
  transferred: { icon: PhoneForwarded, cls: "text-accent-ink border-line-strong bg-raised/60" },
  callback: { icon: RotateCcw, cls: "text-warning border-warning/30 bg-warning/10" },
  unresolved: { icon: CircleAlert, cls: "text-danger border-danger/30 bg-danger/10" },
  missed: { icon: PhoneMissed, cls: "text-danger border-danger/30 bg-danger/10" },
} as const;

// Kimenetel-címke: ikon + szöveg (sosem csak szín)
export function OutcomeChip({ call }: { call: Call }) {
  const t = useTranslations("dash.outcome");
  const key = call.status === "missed" ? "missed" : call.outcome;
  if (!key) return null;
  const { icon: Icon, cls } = OUTCOME[key];
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", cls)}>
      <Icon className="size-3.5" aria-hidden="true" />
      {t(key)}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: "low" | "normal" | "high" }) {
  const t = useTranslations("dash.priority");
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
      <span aria-hidden="true" className={cn("size-2 rounded-full", priority === "high" ? "bg-danger" : priority === "normal" ? "bg-warning" : "bg-ink/30")} />
      {t(priority)}
    </span>
  );
}

export function useFormat() {
  const locale = useLocale();
  const time = (iso: string) => new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  const day = (iso: string) => new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric" }).format(new Date(iso));
  const short = (iso: string) => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  const rel = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const ago = (iso: string) => {
    const s = (new Date(iso).getTime() - Date.now()) / 1000;
    const abs = Math.abs(s);
    if (abs < 60) return rel.format(Math.round(s), "second");
    if (abs < 3600) return rel.format(Math.round(s / 60), "minute");
    if (abs < 86400) return rel.format(Math.round(s / 3600), "hour");
    return rel.format(Math.round(s / 86400), "day");
  };
  const duration = (from: string, to: string | null) => {
    const sec = Math.max(0, Math.round(((to ? new Date(to).getTime() : Date.now()) - new Date(from).getTime()) / 1000));
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  };
  return { time, day, short, ago, duration };
}

// Élő időmérő (másodpercenként frissül)
export function useNow(active = true) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setTick((x) => x + 1), 1000);
    return () => window.clearInterval(id);
  }, [active]);
}

// HÍVÁS RÉSZLETEI – oldalról beúszó panel: összefoglaló, átirat, telefonszám (kattintásra látszik)
export function CallDrawer({ call, onClose }: { call: Call | null; onClose: () => void }) {
  const t = useTranslations("dash.calls");
  const f = useFormat();
  const { issues } = useDashboard();
  const ref = useRef<HTMLDialogElement>(null);
  const [reveal, setReveal] = useState(false);
  useNow(call?.status === "active");

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (call && !d.open) d.showModal();
    if (!call && d.open) d.close();
  }, [call]);

  const related = call ? issues.filter((i) => i.call_id === call.id) : [];

  return (
    <dialog
      ref={ref}
      onClose={() => {
        setReveal(false);
        onClose();
      }}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      aria-label={t("detail")}
      className="dialog-panel fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-lg border-l border-line-strong bg-surface p-0 text-ink shadow-lift"
    >
      {call && (
        <div className="flex h-full flex-col" data-lenis-prevent>
          <div className="flex items-start justify-between gap-4 border-b border-line p-6">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">{call.status === "active" ? t("live") : f.short(call.started_at)}</p>
              <h2 className="mt-1 truncate font-display text-2xl font-bold">{call.caller_name || t("unknown")}</h2>
              <button type="button" onClick={() => setReveal(true)} className="tabular mt-1 text-sm text-muted hover:text-ink" aria-label={t("revealNumber")}>
                {reveal ? call.caller_number : maskPhone(call.caller_number)}
              </button>
            </div>
            <button type="button" onClick={() => ref.current?.close()} aria-label={t("close")} className="flex size-10 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-raised hover:text-ink">
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-wrap items-center gap-2">
              <OutcomeChip call={call} />
              {call.category && <span className="rounded-full border border-line-strong px-2.5 py-1 text-xs font-medium text-muted">{call.category}</span>}
              <span className="tabular text-xs text-muted">{f.duration(call.started_at, call.ended_at)}</span>
            </div>
            {call.summary && (
              <div className="mt-5">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">{t("summary")}</p>
                <p className="mt-2 leading-relaxed">{call.summary}</p>
              </div>
            )}
            {related.length > 0 && (
              <div className="mt-6">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">{t("extracted")}</p>
                <ul className="mt-2 flex flex-col gap-2">
                  {related.map((i) => (
                    <li key={i.id} className="rounded-xl border border-line bg-canvas/40 px-4 py-3 text-sm">
                      <p className="font-semibold">{i.title}</p>
                      {i.detail && <p className="mt-0.5 text-muted">{i.detail}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-6">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">{t("transcript")}</p>
              {call.transcript?.length ? (
                <ol className="mt-3 flex flex-col gap-2.5 text-sm leading-snug">
                  {call.transcript.map((turn, i) => (
                    <li key={i} className={cn("max-w-[88%] rounded-bubble px-3.5 py-2.5", turn.who === "caller" ? "self-start rounded-bl-md bg-raised" : "self-end rounded-br-md border border-brand-pink/30 bg-brand-pink/10")}>
                      <span className="sr-only">{turn.who === "caller" ? t("caller") : t("agent")}: </span>
                      {turn.text}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 text-sm text-muted">{t("noTranscript")}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
