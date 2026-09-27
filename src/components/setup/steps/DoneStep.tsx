"use client";

import { ArrowRight, CircleCheckBig, Play, Sparkles } from "lucide-react";
import { dashboardHref } from "@/lib/dashboard/url";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { CallPlayback, type Turn } from "@/components/landing/CallPlayback";
import { Button } from "@/components/ui/Button";
import { speak, stopSpeaking } from "@/lib/onboarding/client";
import { getVoice } from "@/lib/onboarding/voices";
import { Orb } from "../Guide";
import type { StepProps } from "../types";
import { VoiceBars } from "../ui";

// KÉSZ – ünneplés, élő példahívás a saját cégükkel, a következő lépések és az összefoglaló
export function DoneStep({ data, goTo, onSpeaking }: StepProps & { onSpeaking: (s: boolean) => void }) {
  const t = useTranslations("setup.done");
  const tSteps = useTranslations("setup.steps");
  const tVoice = useTranslations("setup.voice");
  const locale = useLocale() as "hu" | "en" | "de";
  const [playing, setPlaying] = useState(false);
  const businessName = data.profile?.businessName || data.business.name;

  useEffect(() => () => stopSpeaking(), []);
  useEffect(() => onSpeaking(playing), [playing, onSpeaking]);

  const turns = useMemo<Turn[]>(() => {
    const call = data.profile?.sampleCall ?? [];
    // A példahívás az ügynök saját köszönésével indul
    return [{ who: "agent" as const, text: data.voice.greeting }, ...call].filter((x) => x.text.trim()).slice(0, 6);
  }, [data.profile, data.voice.greeting]);

  const listen = async () => {
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    await speak(data.voice.greeting, data.voice.id, locale, () => setPlaying(false));
  };

  const enabledTasks = data.tasks.filter((x) => x.enabled);
  const k = data.knowledge;
  const summary = [
    { label: t("summary.business"), value: `${businessName}${data.profile ? ` · ${data.profile.industryLabel}` : ""}`, step: 0 },
    { label: t("summary.tasks"), value: enabledTasks.map((x) => x.label).join(", "), step: 1 },
    {
      label: t("summary.voice"),
      value:
        data.voice.agentName === getVoice(data.voice.id).name
          ? `${data.voice.agentName} · ${tVoice(`personas.${data.voice.id}`)}`
          : `${data.voice.agentName} · ${getVoice(data.voice.id).name}, ${tVoice(`personas.${data.voice.id}`).toLowerCase()}`,
      step: 2,
    },
    {
      label: t("summary.knowledge"),
      value: k.later
        ? t("summary.knowledgeLater")
        : k.files.length
          ? t("summary.knowledgeFiles", { count: k.files.length })
          : t("summary.knowledgeNone"),
      step: 3,
    },
  ];

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col items-start gap-5">
        <span className="success-pop inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3.5 py-1.5 text-sm font-semibold text-success">
          {data.payment.status === "paid" ? <CircleCheckBig className="size-4" aria-hidden="true" /> : <Sparkles className="size-4" aria-hidden="true" />}
          {data.payment.status === "paid" ? t("paid") : t("demo")}
        </span>
        <button
          type="button"
          onClick={listen}
          className="group flex items-center gap-4 rounded-full border border-line-strong bg-canvas/60 py-2 pr-5 pl-2 text-left transition-colors hover:border-ink/30"
        >
          <Orb active={playing} />
          <span className="flex flex-col">
            <span className="text-sm font-semibold">{t("listen")}</span>
            <span className="text-xs text-muted">{data.voice.agentName}</span>
          </span>
          {playing ? <VoiceBars active className="ml-2" /> : <Play className="ml-2 size-4 fill-current text-accent-ink" aria-hidden="true" />}
        </button>
      </div>

      {turns.length > 1 && (
        <section aria-labelledby="demo-call-title" className="grid items-start gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h3 id="demo-call-title" className="text-xl font-bold tracking-tight">
              {t("demoCall")}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t("demoCallNote")}</p>
          </div>
          <CallPlayback business={businessName} turns={turns} outcome={{ kind: "booked", text: enabledTasks[0]?.label ?? "" }} />
        </section>
      )}

      <section aria-labelledby="next-title">
        <h3 id="next-title" className="text-xl font-bold tracking-tight">
          {t("nextTitle")}
        </h3>
        <ol className="mt-5 flex flex-col">
          {(t.raw("next") as { title: string; text: string }[]).map((item, i) => (
            <li key={item.title} className="grid grid-cols-[2.5rem_1fr] gap-4 border-t border-line-strong py-5">
              <span className="tabular flex size-9 items-center justify-center rounded-full bg-cta text-sm font-bold text-white">{i + 1}</span>
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="your-setup-title" className="rounded-media border border-line-strong bg-canvas/40 p-5 sm:p-7">
        <h3 id="your-setup-title" className="text-lg font-semibold">
          {t("yourSetup")}
        </h3>
        <dl className="mt-4 flex flex-col">
          {summary.map((row) => (
            <div key={row.label} className="grid gap-1 border-t border-line py-4 sm:grid-cols-[9rem_1fr_auto] sm:items-center sm:gap-4">
              <dt className="text-sm text-muted">{row.label}</dt>
              <dd className="text-sm font-medium">{row.value}</dd>
              <dd>
                <button
                  type="button"
                  onClick={() => goTo(row.step)}
                  aria-label={`${t("edit")}: ${tSteps(["business", "tasks", "voice", "knowledge"][row.step] as "business")}`}
                  className="min-h-10 text-sm font-semibold text-accent-ink underline-offset-4 hover:underline"
                >
                  {t("edit")}
                </button>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="flex flex-wrap gap-3">
        <a
          href={dashboardHref(locale)}
          className="group relative isolate inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-cta px-7 text-base font-semibold text-white transition-transform active:scale-[0.98]"
        >
          {t("dashboard")}
          <ArrowRight className="size-4" aria-hidden="true" />
        </a>
        <Button href="/" size="lg" variant="secondary">
          {t("home")}
        </Button>
      </div>
    </div>
  );
}
