"use client";

import { Clock, Globe2, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import type { OnboardingData } from "@/lib/onboarding/schema";
import { getVoice } from "@/lib/onboarding/voices";
import { Orb } from "./Guide";
import { VoiceBars } from "./ui";

// ÉLŐ ELŐNÉZET – ahogy a válaszok születnek, úgy épül fel az ügynök „névjegye”
export function AgentPreview({ data, speaking, className }: { data: OnboardingData; speaking: boolean; className?: string }) {
  const t = useTranslations("setup.preview");
  const tTasks = useTranslations("setup.tasks");
  const tVoice = useTranslations("setup.voice");
  const persona = getVoice(data.voice.id);
  const business = data.profile?.businessName || data.business.name;
  const enabled = data.tasks.filter((x) => x.enabled);

  return (
    <aside aria-label={t("title")} className={cn("relative overflow-hidden rounded-media border border-line-strong bg-surface/80 shadow-lift backdrop-blur-xl", className)}>
      {/* finom fény a kártya tetején */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[120%] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_0_122/0.28),transparent)]" />

      <div className="relative flex flex-col items-center px-6 pt-7 pb-6 text-center">
        <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">
          <span className="live-dot size-1.5 rounded-full bg-success" aria-hidden="true" />
          {t("live")}
        </p>
        <div className="mt-5">
          <Orb active={speaking} size="lg" />
        </div>
        <p className="mt-4 text-2xl font-bold tracking-tight">{data.voice.agentName || persona.name}</p>
        <p className="mt-1 min-h-5 text-sm text-muted">{business || "—"}</p>
        <div className="mt-3 flex h-5 items-center">
          <VoiceBars active={speaking} />
        </div>
      </div>

      {!data.profile ? (
        <p className="relative border-t border-line px-6 py-6 text-center text-sm leading-relaxed text-muted">{t("empty")}</p>
      ) : (
        <div className="relative flex flex-col gap-5 border-t border-line px-6 py-6">
          {data.voice.greeting && (
            <figure>
              <figcaption className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{t("greeting")}</figcaption>
              <blockquote className="mt-2 rounded-bubble rounded-tl-md border border-brand-pink/30 bg-brand-pink/[0.08] px-4 py-3 text-sm leading-relaxed">
                „{data.voice.greeting}”
              </blockquote>
            </figure>
          )}

          {enabled.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{t("tasks")}</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {enabled.slice(0, 7).map((task) => (
                  <li key={task.id} className="rounded-full border border-line-strong bg-canvas/60 px-2.5 py-1 text-xs font-medium">
                    {task.label}
                  </li>
                ))}
                {enabled.length > 7 && <li className="px-1 py-1 text-xs text-muted">+{enabled.length - 7}</li>}
              </ul>
            </div>
          )}

          <dl className="grid gap-3 text-sm">
            <Row icon={Phone} label={t("voice")} value={`${persona.name} · ${tVoice(`personas.${persona.id}`)}`} />
            <Row icon={Clock} label={t("coverage")} value={tTasks(`coverage.${data.coverage}.title`)} />
            <Row icon={Globe2} label={t("languages")} value={data.languages.map((l) => tTasks(`languages.${l}`)).join(", ")} />
          </dl>
        </div>
      )}
    </aside>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <dt className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-raised">
        <Icon className="size-4 text-accent-ink" aria-hidden="true" />
        <span className="sr-only">{label}</span>
      </dt>
      <dd className="min-w-0 flex-1 truncate">{value}</dd>
    </div>
  );
}
