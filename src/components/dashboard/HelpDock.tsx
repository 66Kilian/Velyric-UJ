"use client";

import { ArrowLeft, ChevronRight, LifeBuoy, Mail, MousePointerClick, Search, Send, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState, type FormEvent } from "react";
import { FormAlert } from "@/components/auth/FormAlert";
import { TextArea } from "@/components/setup/ui";
import { Button } from "@/components/ui/Button";
import { site } from "@/lib/site";
import { useDashboard } from "./DashboardProvider";
import { Spotlight } from "./Spotlight";

// SÚGÓ – alul, mindig elérhető. Gyakori elakadások pontos lépésekkel; „Mutasd meg” a felületen
// kiemeli a helyet; ha nem segített, innen írhat nekünk (e-mail).
export const HELP_TOPICS = [
  { key: "noCalls", target: "nav-assistant" },
  { key: "forward", target: null },
  { key: "wrongAnswer", target: "nav-assistant" },
  { key: "hours", target: "nav-assistant" },
  { key: "issues", target: "nav-issues" },
  { key: "look", target: "nav-settings" },
  { key: "invoice", target: "nav-settings" },
  { key: "data", target: "nav-settings" },
  { key: "security", target: "nav-settings" },
] as const;
type TopicKey = (typeof HELP_TOPICS)[number]["key"];

type View = { kind: "list" } | { kind: "topic"; key: TopicKey } | { kind: "contact"; topic: string } | { kind: "show"; key: TopicKey };

export function HelpDock({ onRestartTour }: { onRestartTour: () => void }) {
  const t = useTranslations("dash.help");
  const { user, mode } = useDashboard();
  const [view, setView] = useState<View | null>(null);
  const [query, setQuery] = useState("");

  const topics = useMemo(() => {
    const q = query.trim().toLowerCase();
    return HELP_TOPICS.filter((x) => !q || `${t(`topics.${x.key}.title`)} ${t(`topics.${x.key}.text`)}`.toLowerCase().includes(q));
  }, [query, t]);

  const close = () => setView(null);

  return (
    <>
      <button
        type="button"
        data-tour="help-dock"
        onClick={() => setView({ kind: "list" })}
        className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 flex h-12 items-center gap-2 rounded-full border border-line-strong bg-surface/90 pr-5 pl-3 text-sm font-semibold shadow-lift backdrop-blur-xl transition-transform hover:-translate-y-0.5 lg:right-8 lg:bottom-8"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-cta text-white">
          <LifeBuoy className="size-4" aria-hidden="true" />
        </span>
        {t("button")}
      </button>

      {view?.kind === "show" ? (
        <Spotlight target={HELP_TOPICS.find((x) => x.key === view.key)?.target} onClose={close} label={t("title")} closeLabel={t("close")}>
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-accent-ink uppercase">
            <MousePointerClick className="size-3.5" aria-hidden="true" />
            {t("here")}
          </p>
          <h2 className="mt-2 pr-8 font-display text-lg font-bold">{t(`topics.${view.key}.title`)}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t(`topics.${view.key}.where`)}</p>
          <div className="mt-5 flex justify-end">
            <Button onClick={close} className="h-10">
              {t("gotIt")}
            </Button>
          </div>
        </Spotlight>
      ) : (
        view && (
          <Spotlight onClose={close} label={t("title")} closeLabel={t("close")} width={540}>
            {view.kind === "list" && (
              <div className="flex max-h-[min(70vh,640px)] flex-col">
                <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-accent-ink uppercase">
                  <LifeBuoy className="size-3.5" aria-hidden="true" />
                  {t("eyebrow")}
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold tracking-tight">{t("title")}</h2>
                <div className="relative mt-4">
                  <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("search")}
                    aria-label={t("search")}
                    className="h-11 w-full rounded-xl border border-line-strong bg-canvas/60 pr-3 pl-10 text-[16px] outline-none focus:border-brand-pink/70"
                  />
                </div>
                <ul className="-mx-2 mt-3 flex-1 overflow-y-auto" data-lenis-prevent>
                  {topics.map((x) => (
                    <li key={x.key}>
                      <button
                        type="button"
                        onClick={() => setView({ kind: "topic", key: x.key })}
                        className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-raised"
                      >
                        {t(`topics.${x.key}.title`)}
                        <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                  {!topics.length && <li className="px-3 py-4 text-sm text-muted">{t("noResults")}</li>}
                </ul>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-4">
                  <Button variant="secondary" onClick={() => setView({ kind: "contact", topic: "" })} className="h-10">
                    <Mail className="size-4" aria-hidden="true" />
                    {t("contact")}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      close();
                      onRestartTour();
                    }}
                    className="h-10"
                  >
                    <Sparkles className="size-4" aria-hidden="true" />
                    {t("tour")}
                  </Button>
                </div>
              </div>
            )}

            {view.kind === "topic" && (
              <div>
                <BackButton onClick={() => setView({ kind: "list" })} label={t("back")} />
                <h2 className="mt-3 pr-6 font-display text-xl font-bold tracking-tight">{t(`topics.${view.key}.title`)}</h2>
                <ol className="mt-4 flex flex-col gap-3">
                  {(t.raw(`topics.${view.key}.steps`) as string[]).map((s, i) => (
                    <li key={i} className="grid grid-cols-[1.75rem_1fr] gap-3 text-sm leading-relaxed">
                      <span className="tabular flex size-7 items-center justify-center rounded-full bg-raised text-xs font-bold">{i + 1}</span>
                      <span className="pt-0.5">{s}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4">
                  {HELP_TOPICS.find((x) => x.key === view.key)?.target && (
                    <Button onClick={() => setView({ kind: "show", key: view.key })} className="h-10">
                      <MousePointerClick className="size-4" aria-hidden="true" />
                      {t("showMe")}
                    </Button>
                  )}
                  <Button variant="secondary" onClick={() => setView({ kind: "contact", topic: t(`topics.${view.key}.title`) })} className="h-10">
                    {t("notHelped")}
                  </Button>
                </div>
              </div>
            )}

            {view.kind === "contact" && (
              <ContactForm topic={view.topic} email={user.email} demo={mode === "demo"} onBack={() => setView({ kind: "list" })} />
            )}
          </Spotlight>
        )
      )}
    </>
  );
}

function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
      <ArrowLeft className="size-4" aria-hidden="true" />
      {label}
    </button>
  );
}

function ContactForm({ topic, email, demo, onBack }: { topic: string; email: string; demo: boolean; onBack: () => void }) {
  const t = useTranslations("dash.help");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState(topic);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const mailto = `mailto:${site.supportEmail}?subject=${encodeURIComponent(`[Súgó] ${subject}`)}&body=${encodeURIComponent(message)}`;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 5) return;
    if (demo) {
      window.location.href = mailto;
      return;
    }
    setState("sending");
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, topic: subject, message }),
    }).catch(() => null);
    setState(res?.ok ? "sent" : "error");
  };

  if (state === "sent") {
    return (
      <div className="py-4">
        <FormAlert kind="success">{t("sent")}</FormAlert>
        <Button variant="secondary" onClick={onBack} className="mt-5 h-10">
          {t("back")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <BackButton onClick={onBack} label={t("back")} />
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight">{t("contactTitle")}</h2>
        <p className="mt-1 text-sm text-muted">{t("contactText", { email })}</p>
      </div>
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value.slice(0, 120))}
        placeholder={t("subject")}
        aria-label={t("subject")}
        className="h-11 rounded-xl border border-line-strong bg-canvas/60 px-4 text-[16px] outline-none focus:border-brand-pink/70"
      />
      <TextArea label={t("message")} rows={5} maxLength={4000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("messagePlaceholder")} />
      {state === "error" && (
        <FormAlert kind="error">
          {t("error")}{" "}
          <a href={mailto} className="font-semibold underline">
            {t("mailFallback")}
          </a>
        </FormAlert>
      )}
      <Button type="submit" loading={state === "sending"} disabled={message.trim().length < 5} className="h-11 self-end">
        <Send className="size-4" aria-hidden="true" />
        {t("send")}
      </Button>
    </form>
  );
}
